using EKR.Shared.DTOs;
using EKR.Shared.Responses;

namespace EKR.Application.Interfaces;

public interface IProductService {
    Task<Response<List<ProductDTO>>> GetProductsAsync();
    Task<Response<ProductDTO>> GetProductByIdAsync(Guid id);
    Task<Response<ProductDTO>> CreateProductAsync(ProductCreateDTO dto);
    Task<Response<ProductDTO>> UpdateProductAsync(ProductUpdateDTO dto);
    Task<Response<bool>> DeleteProductAsync(Guid id);
}