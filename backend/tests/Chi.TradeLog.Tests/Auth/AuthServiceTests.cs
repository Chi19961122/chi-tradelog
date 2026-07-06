using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Options;
using Chi.TradeLog.Repositories.Users;
using Chi.TradeLog.Services.Auth;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace Chi.TradeLog.Tests.Auth;

public class AuthServiceTests
{
    private static AuthService CreateService(UserDataModel? user)
    {
        var options = Options.Create(new JwtOptions
        {
            Key = "test-signing-key-that-is-long-enough-for-hs256-aaaa",
            Issuer = "test",
            Audience = "test",
            ExpiryMinutes = 60,
        });
        return new AuthService(new FakeUserRepository(user), options);
    }

    [Fact]
    public async Task LoginAsync_ReturnsTokenAndUser_WhenCredentialsValid()
    {
        var user = new UserDataModel
        {
            Id = 1,
            Email = "alex@chitradelog.com",
            DisplayName = "Alex Chen",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo1234"),
        };
        var service = CreateService(user);

        var result = await service.LoginAsync("alex@chitradelog.com", "demo1234");

        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrWhiteSpace();
        result.User.Name.Should().Be("Alex Chen");
        result.User.Email.Should().Be("alex@chitradelog.com");
    }

    [Fact]
    public async Task LoginAsync_ReturnsNull_WhenPasswordWrong()
    {
        var user = new UserDataModel
        {
            Email = "alex@chitradelog.com",
            DisplayName = "Alex Chen",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo1234"),
        };
        var service = CreateService(user);

        var result = await service.LoginAsync("alex@chitradelog.com", "wrong");

        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ReturnsNull_WhenUserNotFound()
    {
        var service = CreateService(null);

        var result = await service.LoginAsync("nobody@example.com", "demo1234");

        result.Should().BeNull();
    }

    [Fact]
    public async Task RefreshAsync_IssuesNewToken_ForExistingUser()
    {
        var user = new UserDataModel { Id = 1, Email = "alex@chitradelog.com", DisplayName = "Alex Chen" };
        var service = CreateService(user);

        var result = await service.RefreshAsync("alex@chitradelog.com");

        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrWhiteSpace();
        result.User.Email.Should().Be("alex@chitradelog.com");
    }

    [Fact]
    public async Task RefreshAsync_ReturnsNull_WhenUserMissing()
    {
        var service = CreateService(null);

        var result = await service.RefreshAsync("gone@example.com");

        result.Should().BeNull();
    }

    private class FakeUserRepository : IUserRepository
    {
        private readonly UserDataModel? _user;

        public FakeUserRepository(UserDataModel? user) => _user = user;

        public Task<UserDataModel?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
            => Task.FromResult(_user);

        public Task<UserDataModel?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(_user);

        public Task<IReadOnlyList<UserDataModel>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<UserDataModel>>(_user is null ? [] : [_user]);

        public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
            => Task.FromResult(_user is not null);

        public Task<long> InsertAsync(UserDataModel user, CancellationToken cancellationToken = default)
            => Task.FromResult(1L);

        public Task<int> UpdatePasswordAsync(long id, string passwordHash, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<int> UpdateProfileAsync(
            long id, string email, string displayName, bool isAdmin, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<int> DeleteAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<int> CountAdminsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(1);
    }
}
