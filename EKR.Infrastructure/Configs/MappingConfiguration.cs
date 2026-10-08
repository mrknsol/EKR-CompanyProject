using AutoMapper;
using EKR.Domain.Models;
using EKR.Shared.DTOs;

namespace EKR.Infrastructure.Configurations
{
    public class MappingConfiguration : Profile
    {
        public MappingConfiguration()
        {
            CreateMap<ProductCreateDTO, Product>()
                .ConstructUsing(dto => new Product
                {
                    Code = dto.Code,
                    Price = dto.Price,
                    Quantity = dto.Quantity,
                    IsInStock = dto.IsInStock,
                    Season = dto.Season,
                    ModelType = dto.ModelType,
                    ProductColors = dto.ProductColors ?? new List<string>(),
                    ProductSizes = dto.ProductSizes ?? new List<string>(),
                    ImageUrls = dto.Images ?? new List<string>()
                })
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
                .ForMember(dest => dest.ProductReviews, opt => opt.Ignore());

            CreateMap<ProductUpdateDTO, Product>()
                .ConstructUsing(dto => new Product
                {
                    Code = dto.Code ?? "",          
                    Price = dto.Price ?? 0,          
                    Quantity = dto.Quantity ?? 0,
                    IsInStock = dto.IsInStock ?? true, 
                    Season = dto.Season ?? "",
                    ModelType = dto.ModelType ?? "",
                    ProductColors = dto.ProductColors ?? new List<string>(),
                    ProductSizes = dto.ProductSizes ?? new List<string>()
                })
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
                .ForMember(dest => dest.ProductReviews, opt => opt.Ignore());

            CreateMap<Product, ProductDTO>()
                .ConstructUsing(p => new ProductDTO(
                    p.Id,
                    p.Code,
                    p.ModelType,
                    p.Season,
                    p.Price,
                    p.Quantity,
                    p.IsInStock,
                    p.ProductColors ?? new List<string>(),
                    p.ProductSizes ?? new List<string>(),
                    p.ImageUrls ?? new List<string>(),
                    4,
                    p.ModelType + " " + p.Code,
                    ""
                ));

            CreateMap<ProductDTO, Product>()
                .ConstructUsing(dto => new Product
                {
                    Id = dto.Id,
                    Code = dto.Code,
                    Price = dto.Price,
                    Quantity = dto.Quantity,
                    IsInStock = dto.IsInStock,
                    Season = dto.Season,
                    ModelType = dto.ModelType,
                    ProductColors = dto.colors ?? new List<string>(),
                    ProductSizes = dto.sizes ?? new List<string>(),
                    ImageUrls = dto.imageUrls ?? new List<string>()
                })
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
                .ForMember(dest => dest.ProductReviews, opt => opt.Ignore());

            CreateMap<User, RegisterDTO>()
                .ConstructUsing(u => new RegisterDTO(
                    u.Name,
                    u.Surname,
                    u.Email,
                    u.PhoneNumber,
                    "",
                    "",
                    u.Country
                ))
                .ReverseMap()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Password, opt => opt.Ignore())
                .ForMember(dest => dest.UserRoles, opt => opt.Ignore())
                .ForMember(dest => dest.Orders, opt => opt.Ignore())
                .ForMember(dest => dest.LikedProducts, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordResetCode, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordResetCodeExpiryTime, opt => opt.Ignore())
                .ForMember(dest => dest.GoogleId, opt => opt.Ignore())
                .ForMember(dest => dest.WeChatId, opt => opt.Ignore())
                .ForMember(dest => dest.IsEmailVerified, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<User, ProfileDTO>()
                .ConstructUsing(u => new ProfileDTO(
                    u.Id,
                    u.Name,
                    u.Surname,
                    u.Email,
                    u.PhoneNumber,
                    u.Country,
                    u.UserRoles.Select(ur => ur.AppRole.Name).ToList()
                ));

            CreateMap<UpdateProfileDTO, User>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.LastName))
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Order, OrderDTO>()
                .ConstructUsing(o => new OrderDTO(
                    o.Id,
                    o.CustomerId,
                    o.TotalAmount,
                    o.Status.ToString(),
                    o.CreatedAt,
                    o.ShippingAddress,
                    o.OrderItems != null 
                        ? o.OrderItems.Select(oi => new OrderItemDetailsDTO(
                            oi.ProductId,
                            oi.Product.Code ?? string.Empty,
                            oi.Quantity,
                            oi.Quantity * oi.Product.Price
                          )).ToList() 
                        : new List<OrderItemDetailsDTO>()
                ))
                .ReverseMap()
                .ForMember(dest => dest.Customer, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src =>
                    EKR.Infrastructure.Converters.OrderStatusValueConverter.FromStorage(src.Status)))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            CreateMap<OrderItem, OrderItemDetailsDTO>()
                .ConstructUsing(oi => new OrderItemDetailsDTO(
                    oi.ProductId,
                    oi.Product.Code ?? string.Empty,
                    oi.Quantity,
                    oi.Quantity * oi.Product.Price
                ))
                .ReverseMap()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderId, opt => opt.Ignore())
                .ForMember(dest => dest.Order, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore());

            CreateMap<CreateOrderDTO, Order>()
                .ConstructUsing(dto => new Order
                {
                    CustomerId = dto.CustomerId,
                    ShippingAddress = dto.ShippingAddress,
                    Status = OrderStatus.Accepted,
                    CreatedAt = DateTime.UtcNow
                })
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Customer, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore());

            CreateMap<OrderItemDTO, OrderItem>()
                .ConstructUsing(dto => new OrderItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity
                })
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderId, opt => opt.Ignore())
                .ForMember(dest => dest.Order, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore());

            CreateMap<ProductReview, ProductReviewDTO>()
                .ConstructUsing(pr => new ProductReviewDTO(
                    pr.Id,
                    pr.UserId,
                    pr.ProductId,
                    pr.Rating,
                    pr.Comment,
                    pr.CreatedAt,
                    pr.IsApproved,
                    pr.User.Name + " " + pr.User.Surname
                ))
                .ReverseMap()
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore());

            CreateMap<ShippingAddress, ShippingAddressDTO>()
                .ConstructUsing(sa => new ShippingAddressDTO(
                    sa.Id,
                    sa.UserId,
                    sa.AddressLine1,
                    sa.City,
                    sa.PostalCode,
                    sa.Country,
                    sa.IsDefault
                ))
                .ReverseMap()
                .ForMember(dest => dest.User, opt => opt.Ignore());

            CreateMap<Payment, PaymentDTO>()
                .ConstructUsing(p => new PaymentDTO(
                    p.Id,
                    p.OrderId,
                    p.UserId,
                    p.Amount,
                    p.PaymentMethod,
                    p.Status,
                    p.PaymentDate,
                    p.TransactionId
                ))
                .ReverseMap()
                .ForMember(dest => dest.Order, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());
        }
    }
}