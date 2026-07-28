package com.devlink.post_service.repository;

import com.devlink.post_service.entity.ReportReporterDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportReporterDetailRepository extends JpaRepository<ReportReporterDetail, Long> {

    Optional<ReportReporterDetail> findByReportId(Long reportId);

    boolean existsByReportId(Long reportId);
}
