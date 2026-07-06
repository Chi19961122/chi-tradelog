using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Users;
using Chi.TradeLog.Services.Users;
using Chi.TradeLog.Tests.TestDoubles;
using FluentAssertions;
using Xunit;

namespace Chi.TradeLog.Tests.Users;

public class UserServiceTests
{
    private static UserService CreateService(FakeUserRepository repository, StubSettingsRepository? settings = null)
        => new(repository, settings ?? new StubSettingsRepository());

    [Fact]
    public async Task CreateAsync_UsesDefaultPassword_WhenNoneGiven()
    {
        var repository = new FakeUserRepository();
        var settings = new StubSettingsRepository();
        var service = CreateService(repository, settings);

        var result = await service.CreateAsync(new CreateUserInfo { Email = "New@Example.com", Name = "New User" });

        result.Should().NotBeNull();
        result!.TemporaryPassword.Should().Be(UserService.DefaultPassword);
        result.User.Email.Should().Be("new@example.com"); // 正規化為小寫
        result.User.IsAdmin.Should().BeFalse();
        repository.Inserted.Should().NotBeNull();
        // 儲存的是雜湊而非明碼
        repository.Inserted!.PasswordHash.Should().NotBe(UserService.DefaultPassword);
        BCrypt.Net.BCrypt.Verify(UserService.DefaultPassword, repository.Inserted.PasswordHash).Should().BeTrue();
        // 新使用者植入預設商品與標籤
        settings.InsertedSymbols.Should().Contain("AAPL");
        settings.InsertedTags.Should().Contain("manual");
    }

    [Fact]
    public async Task CreateAsync_ReturnsNull_WhenEmailExists()
    {
        var repository = new FakeUserRepository { EmailExists = true };
        var service = CreateService(repository);

        var result = await service.CreateAsync(new CreateUserInfo { Email = "dup@example.com", Name = "Dup" });

        result.Should().BeNull();
    }

    [Fact]
    public async Task ChangePasswordAsync_ReturnsTrue_WhenCurrentPasswordCorrect()
    {
        var repository = new FakeUserRepository
        {
            Existing = new UserDataModel { Id = 1, Email = "u@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("old") },
        };
        var service = CreateService(repository);

        var ok = await service.ChangePasswordAsync(new ChangePasswordInfo { Email = "u@example.com", CurrentPassword = "old", NewPassword = "newpass" });

        ok.Should().BeTrue();
        repository.UpdatedPasswordHash.Should().NotBeNullOrEmpty();
        BCrypt.Net.BCrypt.Verify("newpass", repository.UpdatedPasswordHash!).Should().BeTrue();
    }

    [Fact]
    public async Task ChangePasswordAsync_ReturnsFalse_WhenCurrentPasswordWrong()
    {
        var repository = new FakeUserRepository
        {
            Existing = new UserDataModel { Id = 1, Email = "u@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("old") },
        };
        var service = CreateService(repository);

        var ok = await service.ChangePasswordAsync(new ChangePasswordInfo { Email = "u@example.com", CurrentPassword = "wrong", NewPassword = "newpass" });

        ok.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_Blocked_WhenLastAdmin()
    {
        var repository = new FakeUserRepository
        {
            Existing = new UserDataModel { Id = 1, Email = "a@example.com", IsAdmin = true },
            AdminCount = 1,
        };
        var service = CreateService(repository);

        var result = await service.DeleteAsync(1);

        result.Should().Be(Chi.TradeLog.Common.Enums.UserMutationResult.LastAdminBlocked);
        repository.DeletedId.Should().BeNull(); // 未實際刪除
    }

    [Fact]
    public async Task DeleteAsync_Deletes_WhenAnotherAdminExists()
    {
        var repository = new FakeUserRepository
        {
            Existing = new UserDataModel { Id = 1, Email = "a@example.com", IsAdmin = true },
            AdminCount = 2,
        };
        var service = CreateService(repository);

        var result = await service.DeleteAsync(1);

        result.Should().Be(Chi.TradeLog.Common.Enums.UserMutationResult.Ok);
        repository.DeletedId.Should().Be(1);
    }

    [Fact]
    public async Task UpdateAsync_Blocked_WhenDemotingLastAdmin()
    {
        var repository = new FakeUserRepository
        {
            Existing = new UserDataModel { Id = 1, Email = "a@example.com", DisplayName = "A", IsAdmin = true },
            AdminCount = 1,
        };
        var service = CreateService(repository);

        var result = await service.UpdateAsync(1, new UpdateUserInfo { Name = "A", Email = "a@example.com", IsAdmin = false });

        result.Should().Be(Chi.TradeLog.Common.Enums.UserMutationResult.LastAdminBlocked);
        repository.UpdatedProfile.Should().BeNull(); // 未實際更新
    }

    [Fact]
    public async Task UpdateAsync_UpdatesProfile_AndNormalizesEmail()
    {
        var repository = new FakeUserRepository
        {
            Existing = new UserDataModel { Id = 2, Email = "b@example.com", DisplayName = "B", IsAdmin = false },
            EmailExists = false,
        };
        var service = CreateService(repository);

        var result = await service.UpdateAsync(2, new UpdateUserInfo { Name = "  Bob  ", Email = "New@Example.com", IsAdmin = true });

        result.Should().Be(Chi.TradeLog.Common.Enums.UserMutationResult.Ok);
        repository.UpdatedProfile!.Value.Email.Should().Be("new@example.com");
        repository.UpdatedProfile.Value.Name.Should().Be("Bob");
        repository.UpdatedProfile.Value.IsAdmin.Should().BeTrue();
    }

    [Fact]
    public async Task ResetPasswordAsync_ReturnsDefault_ForExistingUser()
    {
        var repository = new FakeUserRepository { Existing = new UserDataModel { Id = 5, Email = "u@example.com" } };
        var service = CreateService(repository);

        var password = await service.ResetPasswordAsync(5);

        password.Should().Be(UserService.DefaultPassword);
    }

    private class FakeUserRepository : IUserRepository
    {
        public bool EmailExists { get; set; }
        public UserDataModel? Existing { get; set; }
        public UserDataModel? Inserted { get; private set; }
        public string? UpdatedPasswordHash { get; private set; }

        public Task<UserDataModel?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
            => Task.FromResult(Existing);

        public Task<UserDataModel?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(Existing);

        public Task<IReadOnlyList<UserDataModel>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<UserDataModel>>([]);

        public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
            => Task.FromResult(EmailExists);

        public Task<long> InsertAsync(UserDataModel user, CancellationToken cancellationToken = default)
        {
            Inserted = user;
            return Task.FromResult(42L);
        }

        public Task<int> UpdatePasswordAsync(long id, string passwordHash, CancellationToken cancellationToken = default)
        {
            UpdatedPasswordHash = passwordHash;
            return Task.FromResult(1);
        }

        public Task<int> UpdateProfileAsync(
            long id, string email, string displayName, bool isAdmin, CancellationToken cancellationToken = default)
        {
            UpdatedProfile = (email, displayName, isAdmin);
            return Task.FromResult(1);
        }

        public Task<int> DeleteAsync(long id, CancellationToken cancellationToken = default)
        {
            DeletedId = id;
            return Task.FromResult(1);
        }

        public Task<int> CountAdminsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(AdminCount);

        public int AdminCount { get; set; } = 2;
        public (string Email, string Name, bool IsAdmin)? UpdatedProfile { get; private set; }
        public long? DeletedId { get; private set; }
    }
}
