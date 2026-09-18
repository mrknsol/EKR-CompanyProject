using EKR.Shared.DTOs;
using EKR.Shared.Responses;

namespace EKR.Application.Interfaces;

public interface IAccountService {
    public Task<Response<ProfileDTO>?> GetProfileAsync(Guid userId);
    public Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDTO dto);

    public Task<Response<List<UserFullInfoDTO>>> GetAllUsersAsync();
    public Task<Response<UserFullInfoDTO?>> GetUserWithDetailsAsync(Guid userId);
}