package com.collegefeedback.repository;

import com.collegefeedback.entity.FeedbackCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackCampaignRepository extends JpaRepository<FeedbackCampaign, Long> {
    List<FeedbackCampaign> findByStatus(String status);
}
