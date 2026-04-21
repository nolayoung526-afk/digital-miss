package com.wandou.orchestrator.exception;

/** 业务异常 · 带 HTTP 语义的 code */
public class BusinessException extends RuntimeException {

    private final int httpStatus;
    private final int bizCode;

    private BusinessException(int httpStatus, int bizCode, String msg) {
        super(msg);
        this.httpStatus = httpStatus;
        this.bizCode = bizCode;
    }

    public int httpStatus() { return httpStatus; }
    public int bizCode()    { return bizCode; }

    public static BusinessException badRequest(String msg)   { return new BusinessException(400, 40001, msg); }
    public static BusinessException unauthorized(String msg) { return new BusinessException(401, 40101, msg); }
    public static BusinessException forbidden(String msg)    { return new BusinessException(403, 40301, msg); }
    public static BusinessException notFound(String msg)     { return new BusinessException(404, 40401, msg); }
    public static BusinessException conflict(String msg)     { return new BusinessException(409, 40901, msg); }
    public static BusinessException internal(String msg)     { return new BusinessException(500, 50001, msg); }
}
