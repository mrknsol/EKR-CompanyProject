FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY EKR.Api.sln ./
COPY global.json ./
COPY EKR.Domain/EKR.Domain.csproj EKR.Domain/
COPY EKR.Shared/EKR.Shared.csproj EKR.Shared/
COPY EKR.Application/EKR.Application.csproj EKR.Application/
COPY EKR.Infrastructure/EKR.Infrastructure.csproj EKR.Infrastructure/
COPY EKR.Presentation/EKR.Presentation.csproj EKR.Presentation/

RUN dotnet restore EKR.Presentation/EKR.Presentation.csproj

COPY EKR.Domain/ EKR.Domain/
COPY EKR.Shared/ EKR.Shared/
COPY EKR.Application/ EKR.Application/
COPY EKR.Infrastructure/ EKR.Infrastructure/
COPY EKR.Presentation/ EKR.Presentation/

RUN dotnet publish EKR.Presentation/EKR.Presentation.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "EKR.Presentation.dll"]
