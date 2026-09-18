namespace EKR.Domain.Models;

public class Product 
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public int Price { get; set; } 
    public int Quantity { get; set; }
    public bool IsInStock { get; set; } 
    public string Season { get; set; } 
    public string ModelType { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
    public List<string> ProductColors { get; set; } = new List<string>();
    public List<string> ProductSizes { get; set; } = new List<string>();

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    
    public ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();
}