package com.devlink.post_service.service.hander;

import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.service.ReportTargetHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.function.Function;
/**
 * Abstract base handler that eliminates boilerplate for exists() and getAuthorId()
 * using Generics. Concrete handlers only need to implement their own deletion logic.
 *
 * @param <T> the entity type managed by this handler (e.g., Post, Comment)
 */
@RequiredArgsConstructor
public abstract class AbstractTargetHandler<T> implements ReportTargetHandler {
    protected final JpaRepository<T, Long> repository;
    private final Function<T, Long> authorIdExtractor;
    private final ErrorCode notFoundErrorCode;

    @Override
    public boolean exists(Long targetId) {
        return repository.existsById(targetId);
    }

    @Override
    public Long getAuthorId(Long targetId) {
        return repository.findById(targetId)
                .map(authorIdExtractor)
                .orElseThrow(() -> new AppException(notFoundErrorCode));
    }
    @Override
    public Object getSnapshot(Long targetId) {
        return repository.findById(targetId)
                .orElseThrow(() -> new AppException(notFoundErrorCode));
    }
}
