using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BancoTempo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackModeracao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeedbackModeracao",
                table: "Atividades",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeedbackModeracao",
                table: "Atividades");
        }
    }
}
