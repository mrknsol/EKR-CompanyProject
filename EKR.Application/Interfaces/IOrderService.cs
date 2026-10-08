using EKR.Shared.DTOs;
using EKR.Shared.Responses;

namespace EKR.Application.Interfaces;

public interface IOrderService
{
    Task<Response<WholesaleOrderDTO>> CreateAsync(Guid customerId, CreateWholesaleOrderDTO dto);
    Task<Response<List<WholesaleOrderDTO>>> GetMyOrdersAsync(Guid customerId);
    Task<Response<List<WholesaleOrderDTO>>> GetAllOrdersAsync();
    Task<Response<WholesaleOrderDTO>> UpdateStatusAsync(Guid orderId, string status);
    Task<Response<WholesaleOrderDTO>> PayBalanceAsync(Guid orderId, Guid customerId);
    Task<Response<WholesaleOrderDTO>> UpdateSnapshotAsync(Guid orderId, Guid customerId, UpdateOrderSnapshotDTO dto, bool isAdmin);
}
