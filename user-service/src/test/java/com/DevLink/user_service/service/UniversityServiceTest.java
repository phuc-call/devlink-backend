package com.devlink.user_service.service;

import com.devlink.user_service.client.circuitbreaker.UniversityDataLoader;
import com.devlink.user_service.dto.response.UniversityResponse;
import com.devlink.user_service.entity.University;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.UniversityRepository;
import com.devlink.user_service.service.impl.UniversityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UniversityServiceTest {

    @Mock
    private UniversityDataLoader dataLoader;

    @Mock
    private UniversityRepository universityRepository;

    @InjectMocks
    private UniversityServiceImpl universityService;

    private UniversityResponse mockUniversityResponse;
    private University mockUniversity;

    @BeforeEach
    void setUp() {
        mockUniversityResponse = new UniversityResponse();
        mockUniversityResponse.setName("Thakur College of Engineering and Technology");
        mockUniversityResponse.setDomains(List.of("tcetmumbai.in"));
        mockUniversityResponse.setWebPages(List.of("https://www.tcetmumbai.in/"));
        mockUniversityResponse.setCountry("India");
        mockUniversityResponse.setAlphaTwoCode("IN");
        mockUniversityResponse.setStateProvince("Mahārāshtra");

        mockUniversity = new University();
        mockUniversity.setId(1L);
        mockUniversity.setName("Thakur College of Engineering and Technology");
        mockUniversity.setDomain("tcetmumbai.in");
        mockUniversity.setWebsite("https://www.tcetmumbai.in/");
        mockUniversity.setCountry("India");
        mockUniversity.setAlphaTwoCode("IN");
        mockUniversity.setStateProvince("Mahārāshtra");
    }

    @Test
    void TC1_search_ShouldReturnListFromDataLoader() {
        // Arrange
        when(dataLoader.search("Thakur", 20)).thenReturn(List.of(mockUniversityResponse));
        when(universityRepository.searchRichUniversities(eq("Thakur"), any())).thenReturn(Collections.emptyList());

        // Act
        List<UniversityResponse> result = universityService.search("Thakur");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Thakur College of Engineering and Technology", result.get(0).getName());
        verify(dataLoader, times(1)).search("Thakur", 20);
        verify(universityRepository, times(1)).searchRichUniversities(eq("Thakur"), any());
    }

    @Test
    void TC2_selectUniversity_ShouldThrowException_WhenNotFoundInRAM() {
        // Arrange
        when(dataLoader.findByName("Unknown")).thenReturn(null);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> universityService.selectUniversity("Unknown"));
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, ex.getErrorCode());
        verify(universityRepository, never()).findByDomain(any());
        verify(universityRepository, never()).save(any());
    }

    @Test
    void TC3_selectUniversity_ShouldReturnFromDB_WhenExistsInDB() {
        // Arrange
        when(dataLoader.findByName(mockUniversityResponse.getName())).thenReturn(mockUniversityResponse);
        when(universityRepository.findByDomain("tcetmumbai.in")).thenReturn(Optional.of(mockUniversity));

        // Act
        University result = universityService.selectUniversity(mockUniversityResponse.getName());

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("tcetmumbai.in", result.getDomain());
        verify(universityRepository, never()).save(any());
    }

    @Test
    void TC4_selectUniversity_ShouldSaveToDB_WhenNotExistsInDB() {
        // Arrange
        when(dataLoader.findByName(mockUniversityResponse.getName())).thenReturn(mockUniversityResponse);
        when(universityRepository.findByDomain("tcetmumbai.in")).thenReturn(Optional.empty());
        when(universityRepository.save(any(University.class))).thenReturn(mockUniversity);
        // Act
        University result = universityService.selectUniversity(mockUniversityResponse.getName());
        // Assert
        assertNotNull(result);
        assertEquals("tcetmumbai.in", result.getDomain());
        verify(universityRepository, times(1)).save(any(University.class));
    }

    @Test
    void TC5_resolveAndSaveUniversity_ShouldReturnNull_WhenInputIsBlank() {
        assertNull(universityService.resolveAndSaveUniversity(""));
        assertNull(universityService.resolveAndSaveUniversity(null));
        verify(dataLoader, never()).search(anyString(), anyInt());
    }

    @Test
    void TC6_resolveAndSaveUniversity_ShouldSaveUserInput_WhenNoMatchFoundInRAM() {
        // Arrange
        when(dataLoader.search("Random", 1)).thenReturn(Collections.emptyList());
        when(universityRepository.findByDomain("random.edu")).thenReturn(Optional.empty());

        University savedFallback = new University();
        savedFallback.setId(2L);
        savedFallback.setName("Random");
        savedFallback.setDomain("random.edu");

        when(universityRepository.save(any(University.class))).thenReturn(savedFallback);

        // Act
        University result = universityService.resolveAndSaveUniversity("Random");

        // Assert
        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Random", result.getName());
        assertEquals("random.edu", result.getDomain());
        verify(universityRepository, times(1)).save(any(University.class));
    }

    @Test
    void TC7_resolveAndSaveUniversity_ShouldReturnSavedUniversity_WhenMatchFound() {
        // Arrange
        when(dataLoader.search("Thakur College", 1)).thenReturn(List.of(mockUniversityResponse));
        when(universityRepository.findByDomain("tcetmumbai.in")).thenReturn(Optional.empty());
        when(universityRepository.save(any(University.class))).thenReturn(mockUniversity);

        // Act
        University result = universityService.resolveAndSaveUniversity("Thakur College");

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Thakur College of Engineering and Technology", result.getName());
        verify(universityRepository, times(1)).save(any(University.class));
    }

    @Test
    void TC8_resolveAndSaveUniversity_ShouldReturnExistingUniversity_WhenMatchFoundAndExistsInDB() {
        // Arrange
        when(dataLoader.search("Thakur College", 1)).thenReturn(List.of(mockUniversityResponse));
        when(universityRepository.findByDomain("tcetmumbai.in")).thenReturn(Optional.of(mockUniversity));

        // Act
        University result = universityService.resolveAndSaveUniversity("Thakur College");

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(universityRepository, never()).save(any(University.class));
    }
}
