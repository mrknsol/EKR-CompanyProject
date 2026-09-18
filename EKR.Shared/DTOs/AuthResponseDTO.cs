namespace EKR.Shared.DTOs;

public record AuthResponseDTO(
    string Token,
    DateTime TokenExpiry,
    string RefreshToken,
    DateTime RefreshTokenExpiry,
    Guid UserId,
    string Email,
    string FullName,
    List<string> Roles
    );