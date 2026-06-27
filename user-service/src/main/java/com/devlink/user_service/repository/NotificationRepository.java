package com.devlink.user_service.repository;

import com.devlink.user_service.dto.response.NotificationResponse;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Lấy tất cả notification theo thời gian mới nhất
    @Query("""
            SELECT new com.devlink.user_service.dto.response.NotificationResponse(
                n.id, n.actorId, p.fullName, p.avatarUrl,
                n.type, n.content, n.isRead, n.createdAt
            )
            FROM Notification n
            LEFT JOIN UserProfile p ON p.user.id = n.actorId
            WHERE n.userId = :userId AND n.isHidden=false
            ORDER BY n.createdAt DESC
            """)
    Page<NotificationResponse> findByUserIdOrderByCreatedAtDesc(
            @Param("userId") Long userId,
            Pageable pageable
    );


    // Đếm số thông báo chưa đọc và trạng thái được hiển thi
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.isRead = false AND n.isHidden=false")
    int countUnread(@Param("userId") Long userId);
    // Đếm số thông báo chưa đọc và trạng thái là ẩn hiện thị
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.isRead = false AND n.isHidden=true")
    int countUnreadIsHiddenTrue(@Param("userId") Long userId);


    // Đánh dấu 1 thông báo đã đọc — trừ count đi 1
    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.id = :id AND n.userId = :userId AND n.isRead = false
            """)
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId);

    // Đánh dấu tất cả đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsRead(@Param("userId") Long userId);

    @Query("SELECT n.isHidden FROM Notification n WHERE n.id = :id AND n.userId = :userId")
    Optional<Boolean> findIsHiddenByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isHidden = false WHERE n.id = :id AND n.userId = :userId")
    void showOne(@Param("id") Long id, @Param("userId") Long userId);
    @Modifying
    @Query("UPDATE Notification n SET n.isHidden = true WHERE n.id = :id AND n.userId = :userId")
    void hideOne(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.id IN :ids AND n.userId = :userId")
    void deleteManyByIdsAndUserId(@Param("ids") List<Long> ids, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.id = :id AND n.userId = :userId")
    void deleteOne(@Param("id") Long id, @Param("userId") Long userId);

    void deleteByActorIdAndUserIdAndType(Long actorId, Long userId, NotificationType type);

    @Modifying
    @Query("""
        DELETE FROM Notification n
        WHERE n.id IN (
            SELECT n2.id FROM Notification n2
            WHERE n2.isHidden = false
            AND n2.isRead = true
            AND n2.createdAt < :now
            ORDER BY n2.createdAt ASC
        )
        """)
    void deleteAutoNotificationLimit1000(@Param("now") LocalDateTime now);


    @Modifying
    @Query("""
        DELETE FROM Notification n
        WHERE n.id IN :ids""")
    void deleteByIds(@Param("ids") List<Long> ids);

    // Thêm method lấy id
    @Query("""
        SELECT n.id FROM Notification n
        WHERE n.isHidden = false
        AND n.isRead = true
        AND n.createdAt < :now""")
    List<Long> findExpiredIds(@Param("now") LocalDateTime now, Pageable pageable);

}