using AutoMapper;
using EKR.Application.Interfaces;
using EKR.Infrastructure.Context;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using Microsoft.EntityFrameworkCore;

namespace EKR.Application.Services;

public class AccountService : IAccountService
{
    private readonly EKRApplicationContext _context;
    private readonly IMapper _mapper;

    public AccountService(EKRApplicationContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Response<ProfileDTO>?> GetProfileAsync(Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.AppRole)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return Response<ProfileDTO>.Fail("User not found");

        return Response<ProfileDTO>.Ok(_mapper.Map<ProfileDTO>(user));
    }

    public async Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDTO dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return false;

        _mapper.Map(dto, user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Response<List<UserFullInfoDTO>>> GetAllUsersAsync()
    {
        var users = await _context.Users
            .Include(u => u.ShippingAddresses)
            .Include(u => u.Orders).ThenInclude(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(u => u.ProductReviews).ThenInclude(r => r.Product)
            .ToListAsync();

        return Response<List<UserFullInfoDTO>>.Ok(_mapper.Map<List<UserFullInfoDTO>>(users));
    }

    public async Task<Response<UserFullInfoDTO?>> GetUserWithDetailsAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.ShippingAddresses)
            .Include(u => u.Orders).ThenInclude(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(u => u.ProductReviews).ThenInclude(r => r.Product)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return Response<UserFullInfoDTO>.Ok(_mapper.Map<UserFullInfoDTO>(user));
    }
}
