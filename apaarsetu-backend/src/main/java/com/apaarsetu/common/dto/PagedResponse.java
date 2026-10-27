package com.apaarsetu.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: PagedResponse.java
 * Package: com.apaarsetu.common.dto
 * Component: PagedResponse (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Encapsulates pagination metadata and item arrays for large datasets (e.g., student rosters, batch logs, audit trails), translating Spring Data Page objects into frontend-friendly JSON structures.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Stores 'content' (List of T), 'totalElements' (long count), 'totalPages' (int count), and current 'pageNumber' / 'pageSize'.
 * 2. Mirrors the Next.js PagedResponse<T> TypeScript interface for seamless pagination controls in data tables.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {

    @Builder.Default
    private List<T> content = Collections.emptyList();

    private int pageNumber;

    private int pageSize;

    private long totalElements;

    private int totalPages;

    private boolean last;

    @JsonProperty("page")
    public int getPage() {
        return this.pageNumber;
    }

    @JsonProperty("size")
    public int getSize() {
        return this.pageSize;
    }

    public static <T> PagedResponse<T> fromPage(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public static <T> PagedResponse<T> of(List<T> content, int pageNumber, int pageSize, long totalElements) {
        int totalPages = pageSize > 0 ? (int) Math.ceil((double) totalElements / pageSize) : 0;
        boolean last = (pageNumber + 1) >= totalPages;
        return PagedResponse.<T>builder()
                .content(content)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(last)
                .build();
    }
}
