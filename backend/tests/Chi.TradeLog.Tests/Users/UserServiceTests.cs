using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Users;
using Chi.TradeLog.Services.Users;
using FluentAssertions;
using Xunit;

namespace Chi.TradeLog.Tests.Users;

public class UserServiceTests
{
    [Fact]
    public async Task CreateAsync_UsesDefaultPassword_WhenNoneGiven()
    {
        var repository = new FakeUserRepository();
        var service = new UserService(repository);

        var result = await service.CreateAsync(new CreateUserInfo { Email = "New@Example.com", Name = "New User" });

        result.Should().NotBeNull();
        result!.TemporaryPassword.Should().Be(UserService.DefaultPassword);
        result.User.Email.Should().Be("new@example.com"); // 正規化為小寫
        result.User.IsAdmin.Should().BeFalse();
        repository.Inserted.Should().NotBeNull();
        // 儲存的是雜湊而非明碼
        repository.Inserted!.PasswordHash.Should().NotBe(UserService.DefaultPassword);
        BCrypt.Net.BCrypt.Verify(UserService.DefaultPassword, repository.Inserted.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_ReturnsNull_WhenEmailExists()
    {
        var repository = new FakeUserRepository { EmailExists = true };
        var service = new UserService(repository);

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
        var service = new UserService(repository);

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
        var service = new UserService(repository);

        var ok = await service.ChangePasswordAsync(new ChangePasswordInfo { Email = "u@example.com", CurrentPassword = "wrong", NewPassword = "newpass" });

        ok.Should().BeFalse();
    }

    [Fact]
    public async Task ResetPasswordAsync_ReturnsDefault_ForExistingUser()
    {
        var repository = new FakeUserRepository { Existing = new UserDataModel { Id = 5, Email = "u@example.com" } };
        var service = new UserService(repository);

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
    }
}
