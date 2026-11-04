using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BancoTempo.Api.Migrations
{
    /// <inheritdoc />
    public partial class TesteTurmaEventosChecksERodadasDeComprovante : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeedbackConferencia",
                table: "Atividades",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RevisoesComprovantes",
                table: "Atividades",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Finalidade",
                table: "AnexosAtividades",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Rodada",
                table: "AnexosAtividades",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "EventosSistema",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OcorridoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AtividadeId = table.Column<int>(type: "integer", nullable: true),
                    AtorId = table.Column<int>(type: "integer", nullable: true),
                    PapelAtor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    StatusAnterior = table.Column<int>(type: "integer", nullable: true),
                    StatusNovo = table.Column<int>(type: "integer", nullable: true),
                    HttpStatus = table.Column<int>(type: "integer", nullable: true),
                    CodigoMotivo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    DeltaHoras = table.Column<int>(type: "integer", nullable: true),
                    IdRastreio = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosSistema", x => x.Id);
                });

            // Anexos antigos: sem quem enviou eram anexos da oferta; os demais, comprovantes da primeira rodada.
            migrationBuilder.Sql("UPDATE \"AnexosAtividades\" SET \"Finalidade\" = CASE WHEN \"EnviadoPorId\" IS NULL THEN 1 ELSE 2 END;");

            // NOT VALID: vale para toda linha nova ou alterada sem travar bancos de desenvolvimento com dados antigos.
            // Num banco vazio (o do teste com a turma) não há diferença.
            migrationBuilder.Sql("ALTER TABLE \"Usuarios\" ADD CONSTRAINT \"CK_Usuarios_SaldoHoras_NaoNegativo\" CHECK (\"SaldoHoras\" >= 0) NOT VALID;");
            migrationBuilder.Sql("ALTER TABLE \"Atividades\" ADD CONSTRAINT \"CK_Atividades_CustoHoras_Faixa\" CHECK (\"CustoHoras\" BETWEEN 1 AND 4) NOT VALID;");

            migrationBuilder.CreateIndex(
                name: "IX_EventosSistema_AtividadeId",
                table: "EventosSistema",
                column: "AtividadeId");

            migrationBuilder.CreateIndex(
                name: "IX_EventosSistema_OcorridoEm",
                table: "EventosSistema",
                column: "OcorridoEm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventosSistema");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Usuarios_SaldoHoras_NaoNegativo",
                table: "Usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Atividades_CustoHoras_Faixa",
                table: "Atividades");

            migrationBuilder.DropColumn(
                name: "FeedbackConferencia",
                table: "Atividades");

            migrationBuilder.DropColumn(
                name: "RevisoesComprovantes",
                table: "Atividades");

            migrationBuilder.DropColumn(
                name: "Finalidade",
                table: "AnexosAtividades");

            migrationBuilder.DropColumn(
                name: "Rodada",
                table: "AnexosAtividades");
        }
    }
}
