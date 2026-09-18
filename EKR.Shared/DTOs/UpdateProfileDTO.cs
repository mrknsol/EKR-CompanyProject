namespace EKR.Shared.DTOs;

public record UpdateProfileDTO(
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    string? Country
);