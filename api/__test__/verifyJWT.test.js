import { jest } from "@jest/globals";

// Mock do jsonwebtoken ANTES de importar o middleware
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: jest.fn(),
  },
}));

// Imports dinamicos apos mock
const { default: verifyJWT } = await import("../src/services/verifyJWT.js");
const { default: jwt } = await import("jsonwebtoken");

// Helpers para simular req, res e next do Express
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (headers = {}) => ({ headers });

describe("verifyJWT - Testes Unitarios do Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CT01 - Sem token no header: deve retornar 401
  it("CT01 - retorna 401 quando nao ha token no header", () => {
    const req = mockRequest({});
    const res = mockResponse();
    const next = jest.fn();

    verifyJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      auth: false,
      message: "Token n\u00e3o foi fornecido",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // CT02 - Token invalido/expirado: deve retornar 403
  it("CT02 - retorna 403 quando o token e invalido ou expirado", () => {
    const req = mockRequest({ authorization: "token_invalido" });
    const res = mockResponse();
    const next = jest.fn();

    // Simula falha na verificacao do JWT
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error("jwt malformed"), null);
    });

    verifyJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      auth: false,
      message: "Falha na autentica\u00e7\u00e3o do Token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // CT03 - Token valido: deve chamar next() e setar req.userId
  it("CT03 - chama next() e seta req.userId quando token e valido", () => {
    const req = mockRequest({ authorization: "token_valido" });
    req.userId = undefined;
    const res = mockResponse();
    const next = jest.fn();

    // Simula verificacao bem-sucedida
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { id: 42 });
    });

    verifyJWT(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(42);
    expect(res.status).not.toHaveBeenCalled();
  });
});
