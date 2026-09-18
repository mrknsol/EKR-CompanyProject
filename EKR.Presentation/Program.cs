using System.Security.Claims;
using System.Text;
using EKR.Application.Interfaces;
using EKR.Application.Services;
using EKR.Domain.Models;
using EKR.Infrastructure.Configurations;
using EKR.Infrastructure.Context;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://localhost:4173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddTransient<ITokenService, TokenService>();
builder.Services.AddTransient<IAuthService, AuthService>();
builder.Services.AddTransient<IAccountService, AccountService>();
builder.Services.AddTransient<IProductService, ProductService>();
builder.Services.AddTransient<IOrderService, OrderService>();
builder.Services.AddSingleton<IFileStorageService, MinioStorageService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.NameIdentifier,
    };
});

builder.Services.AddDbContext<EKRApplicationContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(typeof(MappingConfiguration));
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await EnsureOrderColumnsAsync(app.Services);
await SeedAdminAsync(app.Services);

app.Run();

static async Task EnsureOrderColumnsAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<EKRApplicationContext>();

    // EF ExecuteSqlRaw treats { } as format placeholders — escape as {{ }}.
    await db.Database.ExecuteSqlRawAsync("""
        ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "TotalPieces" integer NOT NULL DEFAULT 0;
        ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "PaymentMethod" character varying(100) NOT NULL DEFAULT '';
        ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "PaymentType" character varying(32) NOT NULL DEFAULT 'deposit';
        ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "AmountPaid" numeric NOT NULL DEFAULT 0;
        ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "BalanceDue" numeric NOT NULL DEFAULT 0;
        ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "SnapshotJson" text NOT NULL DEFAULT '{{}}';
        """);
}

static async Task SeedAdminAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<EKRApplicationContext>();

    const string adminEmail = "admin@zeir.cn";
    if (await db.Users.AnyAsync(u => u.Email == adminEmail))
        return;

    var adminRole = await db.AppRoles.FirstOrDefaultAsync(r => r.Name == "Admin");
    if (adminRole is null)
        return;

    var adminId = Guid.NewGuid();
    var admin = new User
    {
        Id = adminId,
        Name = "Admin",
        Surname = "ZEIR",
        Email = adminEmail,
        Password = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
        Country = "China",
        PhoneNumber = "+86 00000000000",
        CreatedAt = DateTime.UtcNow,
        IsEmailVerified = true,
        UserRoles =
        [
            new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = adminId,
                RoleId = adminRole.Id,
            }
        ],
    };

    db.Users.Add(admin);
    await db.SaveChangesAsync();
}
