using AutoMapper;
using Microsoft.EntityFrameworkCore;
using EKR.Application.Interfaces;
using EKR.Infrastructure.Context;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using EKR.Domain.Models;

namespace EKR.Application.Services
{
    public class ProductService : IProductService
    {
        private readonly EKRApplicationContext _context;
        private readonly IMapper _mapper;

        public ProductService(EKRApplicationContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<ProductDTO>>> GetProductsAsync()
        {
            var products = await _context.Products.ToListAsync();
            return Response<List<ProductDTO>>.Ok(_mapper.Map<List<ProductDTO>>(products));
        }

        public async Task<Response<ProductDTO>> GetProductByIdAsync(Guid id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return Response<ProductDTO>.Fail("Product not found");

            return Response<ProductDTO>.Ok(_mapper.Map<ProductDTO>(product));
        }

        public async Task<Response<ProductDTO>> CreateProductAsync(ProductCreateDTO dto)
        {
            var product = _mapper.Map<Product>(dto);
            product.Id = Guid.NewGuid();

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();

            return Response<ProductDTO>.Ok(_mapper.Map<ProductDTO>(product));
        }

        public async Task<Response<ProductDTO>> UpdateProductAsync(ProductUpdateDTO dto)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Code == dto.Code);
            if (product == null)
                return Response<ProductDTO>.Fail("Product not found");

            if (dto.Code != null) product.Code = dto.Code;
            if (dto.Price.HasValue) product.Price = dto.Price.Value;
            if (dto.Quantity.HasValue) product.Quantity = dto.Quantity.Value;
            if (dto.IsInStock.HasValue) product.IsInStock = dto.IsInStock.Value;
            if (dto.ModelType != null) product.ModelType = dto.ModelType;
            if (dto.Season != null) product.Season = dto.Season;
            if (dto.ProductSizes != null) product.ProductSizes = dto.ProductSizes;
            if (dto.ProductColors != null) product.ProductColors = dto.ProductColors;

            if (dto.NewImages != null)
            {
                product.ImageUrls = dto.NewImages;
            }

            await _context.SaveChangesAsync();
            return Response<ProductDTO>.Ok(_mapper.Map<ProductDTO>(product));
        }

        public async Task<Response<bool>> DeleteProductAsync(Guid id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return Response<bool>.Fail("Product not found");

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Response<bool>.Ok(true);
        }
    }
}