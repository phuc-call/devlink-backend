package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TagGroupRequest {

    @NotBlank(message = "Group name must not be blank")
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    @NotEmpty(message = "Tags list must not be empty")
    @Size(max = 50, message = "Một nhóm chỉ được tối đa 50 tag")
    private List<String> tags;

    /** If true, system can auto-assign this group when user matches matchKeyword */
    private boolean autoAssignable = false;

    /** Keyword used for auto-matching against UserInterest tags */
    @Size(max = 100)
    private String matchKeyword;
}
