package com.wandou.assetmgr.service;

import com.wandou.assetmgr.adapter.AvatarRenderAdapter;
import com.wandou.assetmgr.adapter.VoiceCloneAdapter;
import com.wandou.assetmgr.api.dto.ClonePersonaRequest;
import com.wandou.assetmgr.api.dto.PersonaResponse;
import com.wandou.assetmgr.domain.TeacherPersona;
import com.wandou.assetmgr.mapper.TeacherPersonaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PersonaService {
    private final TeacherPersonaMapper mapper;
    private final AvatarRenderAdapter avatarAdapter;
    private final VoiceCloneAdapter voiceAdapter;

    @Transactional
    public PersonaResponse clone(ClonePersonaRequest req) {
        String personaId = UUID.randomUUID().toString();

        // 1. 调厂商创建 avatar
        String vendorAvatarId = avatarAdapter.createAvatar(req.getPhotoOssUrl(), req.getDisplayName());
        log.info("avatar created · persona={} vendor={} avatarId={}",
                personaId, avatarAdapter.vendorName(), vendorAvatarId);

        // 2. 调厂商克隆声音
        String vendorVoiceId = voiceAdapter.cloneVoice(req.getVoiceSampleOssUrl(), req.getDisplayName());
        log.info("voice cloned · persona={} vendor={} voiceId={}",
                personaId, voiceAdapter.vendorName(), vendorVoiceId);

        // 3. 落库(reviewing 状态 · 待教研审核)
        TeacherPersona p = new TeacherPersona();
        p.setPersonaId(personaId);
        p.setRealTeacherId(req.getRealTeacherId());
        p.setDisplayName(req.getDisplayName());
        p.setAvatarAssetId(req.getPhotoOssUrl());
        p.setVoiceProfileId(req.getVoiceSampleOssUrl());
        p.setLicenseDocUrl(req.getLicenseDocUrl());
        p.setLicenseValidUntil(req.licenseValidUntilAsDate());
        p.setStatus("reviewing");
        p.setStylePreset("cartoon_2d");
        p.setRenderVendor(avatarAdapter.vendorName());
        p.setVendorAvatarId(vendorAvatarId);
        p.setTtsVendor(voiceAdapter.vendorName());
        p.setVendorVoiceId(vendorVoiceId);
        mapper.insert(p);

        return toResponse(p);
    }

    public PersonaResponse get(String personaId) {
        TeacherPersona p = findByPersonaId(personaId);
        return toResponse(p);
    }

    public PersonaResponse approve(String personaId) {
        TeacherPersona p = findByPersonaId(personaId);
        p.setStatus("approved");
        mapper.updateById(p);
        return toResponse(p);
    }

    private TeacherPersona findByPersonaId(String personaId) {
        return mapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<TeacherPersona>()
                        .eq("persona_id", personaId)
        ).stream().findFirst().orElseThrow(() ->
                new IllegalArgumentException("persona not found: " + personaId));
    }

    private PersonaResponse toResponse(TeacherPersona p) {
        return PersonaResponse.builder()
                .personaId(p.getPersonaId())
                .realTeacherId(p.getRealTeacherId())
                .displayName(p.getDisplayName())
                .status(p.getStatus())
                .renderVendor(p.getRenderVendor())
                .vendorAvatarId(p.getVendorAvatarId())
                .ttsVendor(p.getTtsVendor())
                .vendorVoiceId(p.getVendorVoiceId())
                .licenseValidUntil(p.getLicenseValidUntil().toString())
                .build();
    }
}
