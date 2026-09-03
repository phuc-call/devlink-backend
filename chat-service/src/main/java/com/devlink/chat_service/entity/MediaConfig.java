package com.devlink.chat_service.entity;

import com.devlink.chat_service.entity.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "media_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaConfig {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private MediaType mediaType;

    @Column(name = "max_size_mb", nullable = false)
    private Integer maxSizeMb;

    @Column(name = "max_count_per_msg")
    private Integer maxCountPerMsg;

    @Column(name = "max_duration_sec")
    private Integer maxDurationSec;

    @Column(name = "max_total_size_mb")
    private Integer maxTotalSizeMb;

}
