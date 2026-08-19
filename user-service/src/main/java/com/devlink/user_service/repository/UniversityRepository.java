package com.devlink.user_service.repository;

import com.devlink.user_service.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface UniversityRepository extends JpaRepository<University, Long> {
    Optional<University> findByDomain(String domain);
    Optional<University> findByName(String name);

    @Query("SELECT u.name, u.logo, u.domain, u.website, u.country, u.alphaTwoCode, u.stateProvince, u.domains, u.webPages " +
           "FROM University u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) AND (u.logo IS NOT NULL OR u.description IS NOT NULL)")
    List<Object[]> searchRichUniversities(@Param("keyword") String keyword, Pageable pageable);
}
