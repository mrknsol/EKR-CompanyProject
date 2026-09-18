using System.ComponentModel.DataAnnotations;

namespace EKR.Domain.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    
    public string Country { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    
    public string PasswordResetCode { get; set; } = string.Empty;
    public DateTime PasswordResetCodeExpiryTime { get; set; }
    
    public string? GoogleId { get; set; }
    public string? WeChatId { get; set; }
    
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime? RefreshTokenExpiryTime { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEmailVerified { get; set; } = false;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Product> LikedProducts { get; set; } = new List<Product>();
    
    public ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();
    public ICollection<ShippingAddress> ShippingAddresses { get; set; } = new List<ShippingAddress>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}