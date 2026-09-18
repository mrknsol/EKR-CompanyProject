using EKR.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Configuration;

public class MinioStorageService : IFileStorageService
{
    private readonly IMinioClient _client;
    private readonly string _bucketName;

    public MinioStorageService(IConfiguration config)
    {
        _bucketName = config["Minio:BucketName"];

        _client = new MinioClient()
            .WithEndpoint(config["Minio:Endpoint"])
            .WithCredentials(config["Minio:AccessKey"], config["Minio:SecretKey"])
            .Build();

        EnsureBucketExists().Wait();
    }

    private async Task EnsureBucketExists()
    {
        bool exists = await _client.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(_bucketName)
        );

        if (!exists)
        {
            await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucketName));
        }
    }

    public async Task<string> UploadFileAsync(IFormFile file)
    {
        string fileName = $"{Guid.NewGuid()}_{file.FileName}";

        using var stream = file.OpenReadStream();

        await _client.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(fileName)
            .WithStreamData(stream)
            .WithObjectSize(file.Length)
            .WithContentType(file.ContentType)
        );

        return $"http://localhost:9000/{_bucketName}/{fileName}";
    }

}