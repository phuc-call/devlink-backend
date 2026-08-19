package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.UniversityResponse;
import com.devlink.user_service.entity.University;

import java.util.List;

/**
 * Service for searching and selecting universities.
 */
public interface UniversityService {
    
    /**
     * Searches for universities matching the given keyword.
     *
     * @param keyword the search term
     * @return a list of matching universities
     */
    List<UniversityResponse> search(String keyword);
    
    /**
     * Selects a university by name, fetching it from the dataset and persisting it if necessary.
     *
     * @param name the exact name of the university
     * @return the persisted University entity
     */
    University selectUniversity(String name);

    /**
     * Attempts to resolve a university by searching for a keyword. 
     * If a match is found in the dataset, it ensures the university is saved in the DB and returns it.
     *
     * @param schoolName the search keyword
     * @return the persisted University entity, or null if no match is found
     */
    University resolveAndSaveUniversity(String schoolName);
    
    /**
     * Retrieves the complete details of a university based on its name.
     *
     * @param name the exact name of the university to retrieve information for
     * @return a UniversityResponse containing all details of the university
     */
    UniversityResponse getUniversityByName(String name);
}
