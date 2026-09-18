namespace EKR.Shared.Responses;

public class Response<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static Response<T> Ok(T data, string message = "Success") => new()
    {
        Success = true,
        Message = message,
        Data = data
    };

    public static Response<T> Fail(string message, List<string>? errors = null) => new()
    {
        Success = false,
        Message = message,
        Errors = errors ?? new List<string>()
    };

    public static Response<T> Fail(string message) => new()
    {
        Success = false,
        Message = message,
        Errors = new List<string>()
    };
}
