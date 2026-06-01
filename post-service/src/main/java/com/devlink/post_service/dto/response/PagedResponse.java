package com.devlink.post_service.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Builder
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private String hint;

    public static <T> PagedResponse<T> empty(String hint) {
        return PagedResponse.<T>builder()
                .content(List.of())
                .page(0).size(0)
                .totalElements(0).totalPages(0)
                .hint(hint)
                .build();
    }

    public static <T> PagedResponse<T> of(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}