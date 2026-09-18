namespace EKR.Shared.DTOs;

public record RegisterDTO(
    string FirstName, 
    string LastName, 
    string Email, 
    string Password,
    string PhoneNumber, 
    string ConfirmPassword, 
    string Country
);