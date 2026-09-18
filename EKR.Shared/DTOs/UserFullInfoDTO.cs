namespace EKR.Shared.DTOs;

public record UserFullInfoDTO(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    string Country,
    DateTime CreatedAt,
    bool IsEmailVerified,
    List<ShippingAddressDTO> ShippingAddresses,
    List<OrderDTO> Orders,
    List<ProductReviewDTO> ProductReviews
);