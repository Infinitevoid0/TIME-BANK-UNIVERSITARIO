using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BancoTempo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AumentarLimiteDescricaoHtml : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Descricao",
                table: "Atividades",
                type: "character varying(15000)",
                maxLength: 15000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(5000)",
                oldMaxLength: 5000);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Descricao",
                table: "Atividades",
                type: "character varying(5000)",
                maxLength: 5000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(15000)",
                oldMaxLength: 15000);
        }
    }
}
