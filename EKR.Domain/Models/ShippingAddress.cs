namespace EKR.Domain.Models;

public class ShippingAddress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string AddressLine1 { get; set; }
    public string City { get; set; }
    public string PostalCode { get; set; }
    public string Country { get; set; }
    public bool IsDefault { get; set; } = false;
    
    public User User { get; set; } = null!;
}