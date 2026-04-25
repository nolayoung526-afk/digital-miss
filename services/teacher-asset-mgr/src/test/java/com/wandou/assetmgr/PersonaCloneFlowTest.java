package com.wandou.assetmgr;

import com.wandou.assetmgr.api.dto.ClonePersonaRequest;
import com.wandou.assetmgr.api.dto.PersonaResponse;
import com.wandou.assetmgr.service.PersonaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PersonaCloneFlowTest {

    @Autowired
    private PersonaService service;

    @Test
    void cloneAndApprovePersona() {
        ClonePersonaRequest req = new ClonePersonaRequest();
        req.setRealTeacherId("T-001");
        req.setDisplayName("王老师");
        req.setPhotoOssUrl("oss://bucket/photos/t001.jpg");
        req.setVoiceSampleOssUrl("oss://bucket/voices/t001.wav");
        req.setLicenseDocUrl("oss://bucket/licenses/t001.pdf");
        req.setLicenseValidUntil("2027-12-31");

        PersonaResponse created = service.clone(req);

        assertThat(created.getPersonaId()).isNotBlank();
        assertThat(created.getStatus()).isEqualTo("reviewing");
        assertThat(created.getRenderVendor()).isEqualTo("mock");
        assertThat(created.getVendorAvatarId()).startsWith("mock_avatar_");
        assertThat(created.getTtsVendor()).isEqualTo("mock");
        assertThat(created.getVendorVoiceId()).startsWith("mock_voice_");

        PersonaResponse approved = service.approve(created.getPersonaId());
        assertThat(approved.getStatus()).isEqualTo("approved");
    }
}
