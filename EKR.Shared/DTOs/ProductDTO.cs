namespace EKR.Shared.DTOs;

public record ProductDTO (
    Guid Id,
    string Code,
    string ModelType,
    string Season,
    int Price,
    int Quantity,
    bool IsInStock,
    List<string> colors,
    List<string> sizes,
    List<string> imageUrls
);