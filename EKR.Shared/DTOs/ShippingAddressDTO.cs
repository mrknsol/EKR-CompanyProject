namespace EKR.Shared.DTOs;

public record ShippingAddressDTO(
        Guid Id,
        Guid UserId,
        string AddressLine1,
        string City,
        string PostalCode,
        string Country,
        bool IsDefault
    );