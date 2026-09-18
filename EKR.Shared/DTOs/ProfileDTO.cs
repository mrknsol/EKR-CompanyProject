namespace EKR.Shared.DTOs;

public record ProfileDTO(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    string Country,
    IReadOnlyList<string> Roles
);
