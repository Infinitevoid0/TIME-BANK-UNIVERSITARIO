# API .NET 8 em duas etapas. Roda como o usuário sem privilégios "app".
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
# A pasta de anexos nasce com dono "app"; o volume nomeado herda esse dono na primeira subida.
RUN mkdir -p /app/dados/anexos && chown -R app:app /app/dados
USER app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["BancoTempo.Api.csproj", "."]
RUN dotnet restore "./BancoTempo.Api.csproj"
COPY . .
RUN dotnet publish "./BancoTempo.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BancoTempo.Api.dll"]
