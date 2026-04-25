package com.wandou.assetmgr.api;

import com.wandou.assetmgr.api.dto.ClonePersonaRequest;
import com.wandou.assetmgr.api.dto.PersonaResponse;
import com.wandou.assetmgr.service.PersonaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/persona")
@RequiredArgsConstructor
public class PersonaController {
    private final PersonaService service;

    /** 克隆新 Persona · 同步完成 avatar + voice 厂商调用 · 返回 reviewing 状态 */
    @PostMapping("/clone")
    public PersonaResponse clone(@Valid @RequestBody ClonePersonaRequest req) {
        return service.clone(req);
    }

    @GetMapping("/{personaId}")
    public PersonaResponse get(@PathVariable String personaId) {
        return service.get(personaId);
    }

    /** 教研审核通过 · reviewing → approved */
    @PostMapping("/{personaId}/approve")
    public PersonaResponse approve(@PathVariable String personaId) {
        return service.approve(personaId);
    }
}
