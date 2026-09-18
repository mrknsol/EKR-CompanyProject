namespace EKR.Domain.Models;

public class ProductReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public int Rating { get; set; } 
    public string Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsApproved { get; set; } = false;
    
    public User User { get; set;}
    public Product Product { get; set;}
}