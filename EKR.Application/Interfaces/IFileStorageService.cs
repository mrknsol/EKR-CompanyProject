using Microsoft.AspNetCore.Http;
namespace EKR.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file);
}