package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.dto.request.UpdateMediaConfigRequest;
import com.devlink.chat_service.entity.MediaConfig;
import com.devlink.chat_service.entity.enums.MediaType;
import com.devlink.chat_service.repository.MediaConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaConfigServiceImplTest {

    @Mock private MediaConfigRepository mediaConfigRepository;

    @InjectMocks
    private MediaConfigServiceImpl mediaConfigService;

    // -------------------------------------------------------------------------
    // getConfig
    // -------------------------------------------------------------------------

    @Test
    void getConfig_foundInDb_returnsDbValue() {
        MediaConfig dbConfig = MediaConfig.builder()
                .mediaType(MediaType.IMAGE)
                .maxSizeMb(8)
                .maxCountPerMsg(5)
                .build();

        when(mediaConfigRepository.findById(MediaType.IMAGE)).thenReturn(Optional.of(dbConfig));

        MediaConfig result = mediaConfigService.getConfig(MediaType.IMAGE);

        assertEquals(8, result.getMaxSizeMb());
        assertEquals(5, result.getMaxCountPerMsg());
        verify(mediaConfigRepository, times(1)).findById(MediaType.IMAGE);
    }

    @Test
    void getConfig_notInDb_returnsHardcodedDefault_image() {
        when(mediaConfigRepository.findById(MediaType.IMAGE)).thenReturn(Optional.empty());

        MediaConfig result = mediaConfigService.getConfig(MediaType.IMAGE);

        assertEquals(MediaType.IMAGE, result.getMediaType());
        assertEquals(10, result.getMaxSizeMb());
        assertEquals(10, result.getMaxCountPerMsg());
        assertNull(result.getMaxDurationSec());
    }

    @Test
    void getConfig_notInDb_returnsHardcodedDefault_video() {
        when(mediaConfigRepository.findById(MediaType.VIDEO)).thenReturn(Optional.empty());

        MediaConfig result = mediaConfigService.getConfig(MediaType.VIDEO);

        assertEquals(MediaType.VIDEO, result.getMediaType());
        assertEquals(200, result.getMaxSizeMb());
        assertEquals(300, result.getMaxDurationSec());
        assertEquals(500, result.getMaxTotalSizeMb());
    }

    @Test
    void getConfig_notInDb_returnsHardcodedDefault_file() {
        when(mediaConfigRepository.findById(MediaType.FILE)).thenReturn(Optional.empty());

        MediaConfig result = mediaConfigService.getConfig(MediaType.FILE);

        assertEquals(MediaType.FILE, result.getMediaType());
        assertEquals(50, result.getMaxSizeMb());
        assertEquals(5, result.getMaxCountPerMsg());
    }

    // -------------------------------------------------------------------------
    // updateConfig
    // -------------------------------------------------------------------------

    @Test
    void updateConfig_existingRecord_updatesFields() {
        MediaConfig existing = MediaConfig.builder()
                .mediaType(MediaType.IMAGE)
                .maxSizeMb(5)
                .maxCountPerMsg(5)
                .build();

        MediaConfig saved = MediaConfig.builder()
                .mediaType(MediaType.IMAGE)
                .maxSizeMb(15)
                .maxCountPerMsg(8)
                .build();

        UpdateMediaConfigRequest request = new UpdateMediaConfigRequest();
        request.setMaxSizeMb(15);
        request.setMaxCountPerMsg(8);
        request.setMaxDurationSec(null);
        request.setMaxTotalSizeMb(null);

        when(mediaConfigRepository.findById(MediaType.IMAGE)).thenReturn(Optional.of(existing));
        when(mediaConfigRepository.save(any(MediaConfig.class))).thenReturn(saved);

        MediaConfig result = mediaConfigService.updateConfig(MediaType.IMAGE, request);

        assertEquals(15, result.getMaxSizeMb());
        assertEquals(8, result.getMaxCountPerMsg());
        verify(mediaConfigRepository, times(1)).save(any(MediaConfig.class));
    }

    @Test
    void updateConfig_noExistingRecord_createsNew() {
        MediaConfig saved = MediaConfig.builder()
                .mediaType(MediaType.FILE)
                .maxSizeMb(30)
                .maxCountPerMsg(3)
                .build();

        UpdateMediaConfigRequest request = new UpdateMediaConfigRequest();
        request.setMaxSizeMb(30);
        request.setMaxCountPerMsg(3);

        when(mediaConfigRepository.findById(MediaType.FILE)).thenReturn(Optional.empty());
        when(mediaConfigRepository.save(any(MediaConfig.class))).thenReturn(saved);

        MediaConfig result = mediaConfigService.updateConfig(MediaType.FILE, request);

        assertNotNull(result);
        assertEquals(30, result.getMaxSizeMb());
        verify(mediaConfigRepository, times(1)).save(any(MediaConfig.class));
    }
}
