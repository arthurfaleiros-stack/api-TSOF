import { jest } from "@jest/globals";

// Mock do módulo de conexão com banco ANTES de importar o servico
jest.unstable_mockModule("../src/db/connect.js", () => ({
  default: {
    query: jest.fn(),
  },
}));

// Import dinamico apos o mock ser registrado
const { default: validateCpf } = await import("../src/services/validateCpf.js");
const { default: connect } = await import("../src/db/connect.js");

describe("validateCpf - Testes Unitarios", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Limpa mocks entre cada teste
  });

  // CT01 - CPF nao cadastrado: deve retornar null
  it("CT01 - retorna null quando o CPF nao esta cadastrado", async () => {
    connect.query.mockImplementation((query, values, callback) => {
      callback(null, []); // Sem resultados no banco
    });

    const resultado = await validateCpf("12345678901");
    expect(resultado).toBeNull();
  });

  // CT02 - CPF ja cadastrado sem userId: retorna erro de duplicata
  it("CT02 - retorna erro quando CPF ja cadastrado (sem userId)", async () => {
    connect.query.mockImplementation((query, values, callback) => {
      callback(null, [{ id_usuario: 1 }]);
    });

    const resultado = await validateCpf("12345678901");
    expect(resultado).toEqual({ error: "CPF j\u00e1 cadastrado" });
  });

  // CT03 - CPF pertence a outro usuario (update com userId diferente)
  it("CT03 - retorna erro quando CPF pertence a outro usuario", async () => {
    connect.query.mockImplementation((query, values, callback) => {
      callback(null, [{ id_usuario: 2 }]); // CPF do usuario 2
    });

    const resultado = await validateCpf("12345678901", 1); // Tentando com userId=1
    expect(resultado).toEqual({ error: "CPF j\u00e1 cadastrado para outro usu\u00e1rio" });
  });

  // CT04 - CPF pertence ao mesmo usuario (update do proprio registro)
  it("CT04 - retorna null quando CPF pertence ao proprio usuario (update)", async () => {
    connect.query.mockImplementation((query, values, callback) => {
      callback(null, [{ id_usuario: 1 }]); // CPF do usuario 1
    });

    const resultado = await validateCpf("12345678901", 1); // userId=1 (mesmo usuario)
    expect(resultado).toBeNull();
  });

  // CT05 - Erro na query do banco: deve rejeitar a promise
  it("CT05 - rejeita a promise quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((query, values, callback) => {
      callback(new Error("Erro de conexao"), null);
    });

    await expect(validateCpf("12345678901")).rejects.toBe("Erro ao verificar CPF");
  });
});
