namespace EKR.Application.Interfaces;
public interface ITokenService
{
    string GenerateToken(Guid userId, string email, IEnumerable<string> roles);
    string GenerateRefreshToken();
    public bool ValidateToken(string token);
    Guid? GetUserIdFromToken(string token);
}