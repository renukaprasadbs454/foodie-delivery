package com.foodie.delivery.mapper;

import com.foodie.delivery.dto.response.DeliveryAssignmentResponseDto;
import com.foodie.delivery.dto.response.DeliveryDocumentResponseDto;
import com.foodie.delivery.dto.response.DeliveryOfferResponseDto;
import com.foodie.delivery.dto.response.DeliveryProfileResponseDto;
import com.foodie.delivery.entity.DeliveryAssignment;
import com.foodie.delivery.entity.DeliveryPartner;
import com.foodie.delivery.entity.DeliveryPartnerDocument;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DeliveryMapper {

        public DeliveryProfileResponseDto toProfile(DeliveryPartner partner, String profileImageUrl,
                        java.util.List<DeliveryDocumentResponseDto> documents) {
                return new DeliveryProfileResponseDto(
                                partner.getId(),
                                partner.getFullName(),
                                partner.getVehicleType().name(),
                                partner.getVehicleNumber(),
                                partner.getKycStatus().name(),
                                partner.isOnline(),
                                profileImageUrl,
                                documents);
        }

        public DeliveryDocumentResponseDto toDocument(DeliveryPartnerDocument document) {
                return new DeliveryDocumentResponseDto(
                                document.getId(),
                                document.getDocType().name(),
                                document.getVerificationStatus().name(),
                                document.getS3Key(),
                                document.getCreatedAt());
        }

        public DeliveryOfferResponseDto toOffer(
                        DeliveryAssignment assignment,
                        String restaurantName,
                        String pickupAddress,
                        Double estimatedDistance,
                        BigDecimal estimatedFee) {
                return new DeliveryOfferResponseDto(
                                assignment.getId(),
                                assignment.getOrderId(),
                                restaurantName,
                                pickupAddress,
                                estimatedDistance,
                                estimatedFee);
        }

        public DeliveryAssignmentResponseDto toAssignment(DeliveryAssignment assignment) {
                boolean pickupOtpRequired = assignment.getStatus().name().equals("ACCEPTED")
                                && assignment.getPickupVerifiedAt() == null;
                return new DeliveryAssignmentResponseDto(
                                assignment.getId(),
                                assignment.getOrderId(),
                                assignment.getStatus().name(),
                                pickupOtpRequired,
                                assignment.getAssignedAt(),
                                assignment.getPickupVerifiedAt(),
                                assignment.getDeliveredVerifiedAt());
        }
}
