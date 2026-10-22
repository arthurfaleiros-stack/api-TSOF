/**
 * Testes de Integracao - Evento Controller
 * Pre-requisito: docker-compose up -d
 *
 * Nota: createEvento usa multer (multipart/form-data) para upload de imagem.
 * Os testes usam fk_id_organizador=1 (seed do banco).
 */
import supertest from "supertest";

const BASE_URL = "http://localhost:5000";
const request = supertest(BASE_URL);

const TS = Date.now().toString().slice(-8);

const eventoBase = {
  nome: `Evento Teste ${TS}`,
  descricao: "Descricao do evento de teste para integracao",
  data_hora: "2025-12-31 20:00:00",
  local: "Local de Teste",
  fk_id_organizador: "1", // Usa organizador do seed
};

let idCriado = null;

describe("Evento - Testes de Integracao", () => {
  // ================================================================
  describe("POST /api/v1/evento - Criar Evento", () => {
    // CT01 - Dados validos sem imagem: deve retornar 201
    it("CT01 - cria evento com dados validos e retorna 201", async () => {
      const response = await request
        .post("/api/v1/evento")
        .field("nome", eventoBase.nome)
        .field("descricao", eventoBase.descricao)
        .field("data_hora", eventoBase.data_hora)
        .field("local", eventoBase.local)
        .field("fk_id_organizador", eventoBase.fk_id_organizador);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Evento criado com sucesso");
    });

    // CT02 - Campos faltando: deve retornar 400
    it("CT02 - retorna 400 quando campos obrigatorios estao ausentes", async () => {
      const response = await request
        .post("/api/v1/evento")
        .field("nome", "Sem outros campos");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Todos os campos devem ser preenchidos");
    });
  });

  // ================================================================
  describe("GET /api/v1/evento - Listar Eventos", () => {
    // CT03 - Deve retornar 200 com lista de eventos
    it("CT03 - retorna 200 com lista de eventos", async () => {
      const response = await request.get("/api/v1/evento");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("events");
      expect(Array.isArray(response.body.events)).toBe(true);

      // Captura ID do evento criado para os proximos testes
      const criado = response.body.events.find((e) => e.nome === eventoBase.nome);
      if (criado) idCriado = criado.id_evento;
    });
  });

  // ================================================================
  describe("PUT /api/v1/evento - Atualizar Evento", () => {
    // CT04 - Atualizar evento existente: deve retornar 200
    it("CT04 - atualiza evento existente e retorna 200", async () => {
      if (!idCriado) {
        console.warn("ID do evento nao disponivel, pulando CT04");
        return;
      }

      const response = await request.put("/api/v1/evento").send({
        id_evento: idCriado,
        nome: `Evento Atualizado ${TS}`,
        descricao: "Descricao atualizada",
        data_hora: "2026-01-15 19:00:00",
        local: "Novo Local",
        fk_id_organizador: 1,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Evento atualizado com sucesso");
    });

    // CT05 - ID inexistente: deve retornar 404
    it("CT05 - retorna 404 quando o ID do evento nao existe", async () => {
      const response = await request.put("/api/v1/evento").send({
        id_evento: 999999,
        nome: "Inexistente",
        descricao: "Desc",
        data_hora: "2026-01-01 00:00:00",
        local: "Lugar",
        fk_id_organizador: 1,
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Evento nao encontrado");
    });
  });

  // ================================================================
  describe("DELETE /api/v1/evento/:id - Deletar Evento", () => {
    // CT06 - ID inexistente: deve retornar 404
    it("CT06 - retorna 404 quando o ID do evento nao existe", async () => {
      const response = await request.delete("/api/v1/evento/999999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Evento nao encontrado");
    });

    // CT07 - Deleta evento criado (cleanup)
    it("CT07 - deleta o evento criado durante os testes (cleanup)", async () => {
      if (!idCriado) {
        console.warn("ID do evento nao disponivel, pulando cleanup");
        return;
      }

      const response = await request.delete(`/api/v1/evento/${idCriado}`);
      expect(response.status).toBe(200);
    });
  });
});
