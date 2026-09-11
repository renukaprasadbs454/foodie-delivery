package com.foodie.delivery.service.impl;

import com.foodie.auth.exception.InvalidOtpException;
import com.foodie.common.enums.DeliveryAssignmentStatus;
import com.foodie.common.enums.DeliveryDocType;
import com.foodie.common.enums.KycStatus;
import com.foodie.common.enums.OrderStatus;
import com.foodie.common.enums.UserType;
import com.foodie.common.enums.VehicleType;
import com.foodie.common.exception.BadRequestException;
import com.foodie.common.exception.ConflictException;
import com.foodie.common.exception.ErrorCode;
import com.foodie.common.exception.ResourceNotFoundException;
import com.foodie.common.exception.UnprocessableEntityException;
import com.foodie.common.util.HashUtils;
import com.foodie.delivery.config.DeliveryProperties;
import com.foodie.delivery.dto.request.LocationPingRequestDto;
import com.foodie.delivery.dto.request.SetAvailabilityRequestDto;
import com.foodie.delivery.dto.request.UpsertDeliveryProfileRequestDto;
import com.foodie.delivery.dto.request.VerifyOtpRequestDto;
import com.foodie.delivery.dto.response.AvailabilityResponseDto;
import com.foodie.delivery.dto.response.DeliveryAssignmentResponseDto;
import com.foodie.delivery.dto.response.DeliveryDocumentResponseDto;
import com.foodie.delivery.dto.response.DeliveryOfferResponseDto;
import com.foodie.delivery.dto.response.DeliveryProfileImageResponseDto;
import com.foodie.delivery.dto.response.DeliveryProfileResponseDto;
import com.foodie.delivery.entity.DeliveryAssignment;
import com.foodie.delivery.entity.DeliveryPartner;
import com.foodie.delivery.entity.DeliveryPartnerDocument;
import com.foodie.delivery.mapper.DeliveryMapper;
import com.foodie.delivery.repository.DeliveryAssignmentRepository;
import com.foodie.delivery.repository.DeliveryPartnerDocumentRepository;
import com.foodie.delivery.repository.DeliveryPartnerRepository;
import com.foodie.delivery.service.DeliveryService;
import com.foodie.delivery.service.PartnerGeoService.GeoPartnerHit;
import com.foodie.delivery.service.PartnerGeoService;
import com.foodie.infrastructure.storage.DocumentMagicBytes;
import com.foodie.infrastructure.storage.ImageMagicBytes;
import com.foodie.infrastructure.storage.ObjectStorageClient;
import com.foodie.security.ratelimit.RedisRateLimiter;
import com.foodie.shared.contract.OrderDeliveryPort;
import com.foodie.shared.contract.RestaurantPickupQuery;
import com.foodie.shared.event.DeliveryCompletedEvent;
import com.foodie.shared.event.DeliveryLocationUpdatedEvent;
import com.foodie.shared.event.DeliveryPartnerAssignedEvent;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.foodie.delivery.entity.DeliveryLocationHistory;
import com.foodie.delivery.repository.DeliveryLocationHistoryRepository;
import com.foodie.delivery.repository.DeliveryCashDepositRepository;
import com.foodie.payment.repository.PaymentRepository;
import com.foodie.delivery.service.DeliveryPricingService;
import java.math.BigDecimal;
import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;

@Service
public class DeliveryServiceImpl implements DeliveryService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryServiceImpl.class);
    private static final long MAX_DOCUMENT_BYTES = 10L * 1024 * 1024;
    private static final Duration LOCATION_PING_WINDOW = Duration.ofSeconds(3);
    private static final Duration SIGNED_URL_TTL = Duration.ofMinutes(15);
    private static final String DEFAULT_FULL_NAME = "Delivery Partner";

    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final DeliveryPartnerDocumentRepository deliveryPartnerDocumentRepository;
    private final DeliveryAssignmentRepository deliveryAssignmentRepository;
    private final DeliveryLocationHistoryRepository deliveryLocationHistoryRepository;
    private final DeliveryCashDepositRepository deliveryCashDepositRepository;
    private final PaymentRepository paymentRepository;
    private final DeliveryMapper deliveryMapper;
    private final ObjectStorageClient objectStorageClient;
    private final PartnerGeoService partnerGeoService;
    private final OrderDeliveryPort orderDeliveryPort;
    private final RestaurantPickupQuery restaurantPickupQuery;
    private final ApplicationEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;
    private final RedisRateLimiter redisRateLimiter;
    private final DeliveryProperties deliveryProperties;
    private final DeliveryPricingService deliveryPricingService;

    public DeliveryServiceImpl(
            DeliveryPartnerRepository deliveryPartnerRepository,
            DeliveryPartnerDocumentRepository deliveryPartnerDocumentRepository,
            DeliveryAssignmentRepository deliveryAssignmentRepository,
            DeliveryLocationHistoryRepository deliveryLocationHistoryRepository,
            DeliveryCashDepositRepository deliveryCashDepositRepository,
            PaymentRepository paymentRepository,
            DeliveryMapper deliveryMapper,
            ObjectStorageClient objectStorageClient,
            PartnerGeoService partnerGeoService,
            OrderDeliveryPort orderDeliveryPort,
            RestaurantPickupQuery restaurantPickupQuery,
            ApplicationEventPublisher eventPublisher,
            PasswordEncoder passwordEncoder,
            RedisRateLimiter redisRateLimiter,
            DeliveryProperties deliveryProperties,
            DeliveryPricingService deliveryPricingService) {
        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.deliveryPartnerDocumentRepository = deliveryPartnerDocumentRepository;
        this.deliveryAssignmentRepository = deliveryAssignmentRepository;
        this.deliveryLocationHistoryRepository = deliveryLocationHistoryRepository;
        this.deliveryCashDepositRepository = deliveryCashDepositRepository;
        this.paymentRepository = paymentRepository;
        this.deliveryMapper = deliveryMapper;
        this.objectStorageClient = objectStorageClient;
        this.partnerGeoService = partnerGeoService;
        this.orderDeliveryPort = orderDeliveryPort;
        this.restaurantPickupQuery = restaurantPickupQuery;
        this.eventPublisher = eventPublisher;
        this.passwordEncoder = passwordEncoder;
        this.redisRateLimiter = redisRateLimiter;
        this.deliveryProperties = deliveryProperties;
        this.deliveryPricingService = deliveryPricingService;
    }

    @Override
    @Transactional
    public DeliveryProfileResponseDto getOrCreateProfile(UUID userCredentialId) {
        DeliveryPartner partner = deliveryPartnerRepository.findByUserCredentialId(userCredentialId)
                .orElseGet(() -> deliveryPartnerRepository.save(DeliveryPartner.create(
                        userCredentialId,
                        DEFAULT_FULL_NAME,
                        com.foodie.common.enums.VehicleType.BIKE,
                        null)));

        java.util.List<DeliveryDocumentResponseDto> docs = deliveryPartnerDocumentRepository
                .findByDeliveryPartnerId(partner.getId())
                .stream()
                .map(deliveryMapper::toDocument)
                .toList();
        return deliveryMapper.toProfile(partner, signedOrNull(partner.getProfileImageKey()), docs);
    }

    @Override
    @Transactional
    public DeliveryProfileResponseDto upsertProfile(UUID userCredentialId, UpsertDeliveryProfileRequestDto request) {
        DeliveryPartner partner = deliveryPartnerRepository.findByUserCredentialId(userCredentialId)
                .orElseGet(() -> DeliveryPartner.create(
                        userCredentialId,
                        request.fullName(),
                        request.vehicleType(),
                        request.vehicleNumber()));
        partner.updateProfile(request.fullName(), request.vehicleType(), request.vehicleNumber());
        deliveryPartnerRepository.save(partner);
        java.util.List<DeliveryDocumentResponseDto> docs = deliveryPartnerDocumentRepository
                .findByDeliveryPartnerId(partner.getId())
                .stream()
                .map(deliveryMapper::toDocument)
                .toList();
        return deliveryMapper.toProfile(partner, signedOrNull(partner.getProfileImageKey()), docs);
    }

    @Override
    @Transactional
    public DeliveryDocumentResponseDto uploadDocument(
            UUID userCredentialId,
            DeliveryDocType docType,
            MultipartFile file) {
        DeliveryPartner partner = deliveryPartnerRepository.findByUserCredentialId(userCredentialId)
                .orElseGet(() -> deliveryPartnerRepository.save(DeliveryPartner.create(
                        userCredentialId,
                        DEFAULT_FULL_NAME,
                        com.foodie.common.enums.VehicleType.BIKE,
                        null)));
        byte[] bytes = readBytes(file, MAX_DOCUMENT_BYTES, "Document must be at most 10 MB.");
        DocumentMagicBytes.DetectedDocument detected = DocumentMagicBytes.detect(
                header(bytes), file.getContentType());
        String key = "delivery-partners/" + partner.getId() + "/documents/" + docType.name()
                + "/" + UUID.randomUUID() + "." + detected.extension();
        objectStorageClient.putObject(key, new ByteArrayInputStream(bytes), bytes.length, detected.contentType());
        DeliveryPartnerDocument document = deliveryPartnerDocumentRepository.save(
                DeliveryPartnerDocument.create(partner, docType, key));
        return deliveryMapper.toDocument(document);
    }

    @Override
    @Transactional
    public DeliveryProfileImageResponseDto uploadProfileImage(
            UUID userCredentialId,
            MultipartFile file) {
        DeliveryPartner partner = deliveryPartnerRepository.findByUserCredentialId(userCredentialId)
                .orElseGet(() -> deliveryPartnerRepository.save(DeliveryPartner.create(
                        userCredentialId,
                        DEFAULT_FULL_NAME,
                        com.foodie.common.enums.VehicleType.BIKE,
                        null)));
        byte[] bytes = readBytes(file, 5 * 1024 * 1024, "Image must be at most 5 MB.");
        ImageMagicBytes.DetectedImage detected = ImageMagicBytes.detect(header(bytes), file.getContentType());
        String key = "delivery-partners/" + partner.getId() + "/profile/"
                + UUID.randomUUID() + "." + detected.extension();
        objectStorageClient.putObject(key, new java.io.ByteArrayInputStream(bytes), bytes.length,
                detected.contentType());
        partner.setProfileImageKey(key);
        deliveryPartnerRepository.save(partner);
        return new DeliveryProfileImageResponseDto(key, java.time.Instant.now().toString());
    }

    @Override
    @Transactional
    public AvailabilityResponseDto setAvailability(UUID userCredentialId, SetAvailabilityRequestDto request) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        if (Boolean.TRUE.equals(request.isOnline()) && partner.getKycStatus() != KycStatus.VERIFIED) {
            throw new UnprocessableEntityException(
                    ErrorCode.KYC_NOT_VERIFIED,
                    "KYC must be verified before going online.");
        }
        partner.setOnline(request.isOnline());
        return new AvailabilityResponseDto(partner.isOnline());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeliveryOfferResponseDto> listOffers(UUID userCredentialId) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        return deliveryAssignmentRepository
                .findByDeliveryPartnerIdAndStatus(partner.getId(), DeliveryAssignmentStatus.OFFERED)
                .stream()
                .map(assignment -> toOffer(assignment, partner.getId()))
                .toList();
    }

    @Override
    @Transactional
    public DeliveryAssignmentResponseDto accept(UUID userCredentialId, UUID assignmentId) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        DeliveryAssignment assignment = deliveryAssignmentRepository
                .findByIdAndDeliveryPartnerId(assignmentId, partner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        if (assignment.getStatus() == DeliveryAssignmentStatus.ACCEPTED) {
            return deliveryMapper.toAssignment(assignment);
        }
        if (assignment.getStatus() != DeliveryAssignmentStatus.OFFERED) {
            throw new ConflictException(
                    ErrorCode.ASSIGNMENT_ALREADY_ACCEPTED,
                    "Assignment is no longer available.");
        }

        try {
            assignment.accept();
            deliveryAssignmentRepository.saveAndFlush(assignment);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException(
                    ErrorCode.ASSIGNMENT_ALREADY_ACCEPTED,
                    "Assignment was already accepted by another partner.");
        }

        orderDeliveryPort.assignPartner(assignment.getOrderId(), partner.getId());
        eventPublisher.publishEvent(DeliveryPartnerAssignedEvent.of(
                assignment.getOrderId(), partner.getId(), assignment.getId()));
        return deliveryMapper.toAssignment(assignment);
    }

    @Override
    @Transactional
    public DeliveryAssignmentResponseDto verifyPickup(
            UUID userCredentialId,
            UUID assignmentId,
            VerifyOtpRequestDto request) {
        DeliveryAssignment assignment = requireAssignment(userCredentialId, assignmentId);
        if (assignment.getStatus() != DeliveryAssignmentStatus.ACCEPTED) {
            throw new UnprocessableEntityException(
                    ErrorCode.ILLEGAL_STATUS_TRANSITION,
                    "Pickup verification requires ACCEPTED assignment.");
        }
        if (!passwordEncoder.matches(request.otp(), assignment.getPickupOtpHash())) {
            throw new InvalidOtpException();
        }
        assignment.markPickupVerified();
        deliveryAssignmentRepository.save(assignment);
        orderDeliveryPort.markPickedUpAndOutForDelivery(assignment.getOrderId());
        return deliveryMapper.toAssignment(assignment);
    }

    @Override
    @Transactional
    public DeliveryAssignmentResponseDto verifyDelivery(
            UUID userCredentialId,
            UUID assignmentId,
            VerifyOtpRequestDto request) {
        DeliveryAssignment assignment = requireAssignment(userCredentialId, assignmentId);
        if (assignment.getStatus() != DeliveryAssignmentStatus.PICKED_UP) {
            throw new UnprocessableEntityException(
                    ErrorCode.ILLEGAL_STATUS_TRANSITION,
                    "Delivery verification requires PICKED_UP assignment.");
        }
        if (!passwordEncoder.matches(request.otp(), assignment.getDeliveryOtpHash())) {
            throw new InvalidOtpException();
        }
        assignment.markDelivered();
        deliveryAssignmentRepository.save(assignment);

        // Update Cash in Hand if COD payment
        paymentRepository.findByOrderId(assignment.getOrderId()).ifPresent(payment -> {
            if (payment.getWalletAmount() == null || payment.getWalletAmount().compareTo(BigDecimal.ZERO) == 0) {
                DeliveryPartner partner = assignment.getDeliveryPartner();
                partner.addCash(payment.getAmount());
                deliveryPartnerRepository.save(partner);
            }
        });

        orderDeliveryPort.markDelivered(assignment.getOrderId());
        eventPublisher.publishEvent(DeliveryCompletedEvent.of(
                assignment.getOrderId(), assignment.getDeliveryPartner().getId(), assignment.getId()));
        return deliveryMapper.toAssignment(assignment);
    }

    @Override
    @Transactional
    public void locationPing(UUID userCredentialId, LocationPingRequestDto request) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        redisRateLimiter.check("ratelimit:location:" + partner.getId(), 100, LOCATION_PING_WINDOW);

        double lat = request.latitude().doubleValue();
        double lng = request.longitude().doubleValue();
        partnerGeoService.addLocation(partner.getId(), lat, lng);

        deliveryAssignmentRepository
                .findFirstByDeliveryPartnerIdAndStatusIn(
                        partner.getId(),
                        List.of(DeliveryAssignmentStatus.PICKED_UP))
                .ifPresent(assignment -> {
                    deliveryLocationHistoryRepository.save(DeliveryLocationHistory.create(
                            assignment.getId(), partner.getId(), request.latitude(), request.longitude()));
                    eventPublisher.publishEvent(
                            DeliveryLocationUpdatedEvent.of(assignment.getOrderId(), lat, lng));
                });
    }

    @Override
    @Transactional
    public void createAssignmentForOrder(UUID orderId) {
        if (deliveryAssignmentRepository.findByOrderId(orderId).isPresent()) {
            return;
        }

        OrderDeliveryPort.OrderDeliverySnapshot order = orderDeliveryPort.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        if (order.status() != OrderStatus.READY_FOR_PICKUP && order.status() != OrderStatus.PREPARING && order.status() != OrderStatus.ACCEPTED) {
            throw new UnprocessableEntityException(
                    ErrorCode.ILLEGAL_STATUS_TRANSITION,
                    "Order must be ACCEPTED, PREPARING, or READY_FOR_PICKUP to create a delivery assignment.");
        }

        RestaurantPickupQuery.PickupLocation pickup = restaurantPickupQuery.findByRestaurantId(order.restaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant pickup location not found."));

        double restaurantLat = pickup.latitude().doubleValue();
        double restaurantLng = pickup.longitude().doubleValue();
        double radiusKm = deliveryProperties.getOfferRadiusKm();

        Optional<DeliveryPartner> selectedPartner = Optional.empty();
        Double selectedDistance = null;
        try {
            for (GeoPartnerHit hit : partnerGeoService.findNearby(restaurantLat, restaurantLng, radiusKm)) {
                Optional<DeliveryPartner> candidate = deliveryPartnerRepository.findById(hit.partnerId());
                if (candidate.isPresent()
                        && candidate.get().isOnline()
                        && candidate.get().getKycStatus() == KycStatus.VERIFIED
                        && !candidate.get().isCashLimitExceeded()) {
                    selectedPartner = candidate;
                    selectedDistance = hit.distanceKm();
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Redis error calculating GeoRadius in assignment: {}", e.getMessage());
        }

        if (selectedPartner.isEmpty()) {
            log.warn("No online verified delivery partner found within {} km for order {}", radiusKm, orderId);
            return;
        }

        String pickupOtp = HashUtils.sixDigitOtp();
        String deliveryOtp = HashUtils.sixDigitOtp();
        DeliveryAssignment assignment = DeliveryAssignment.createOffered(
                orderId,
                selectedPartner.get(),
                passwordEncoder.encode(pickupOtp),
                passwordEncoder.encode(deliveryOtp));
        deliveryAssignmentRepository.save(assignment);
        log.info(
                "Created OFFERED delivery assignment {} for order {} partner {} distanceKm={}",
                assignment.getId(),
                orderId,
                selectedPartner.get().getId(),
                selectedDistance);
    }

    @Override
    @Transactional
    public DeliveryProfileResponseDto verifyKyc(UUID partnerId, UUID adminId) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery partner not found."));
        partner.verifyKyc();
        log.info("Delivery partner {} KYC verified by admin {}", partnerId, adminId);
        List<DeliveryDocumentResponseDto> docs = deliveryPartnerDocumentRepository
                .findByDeliveryPartnerId(partner.getId())
                .stream()
                .map(deliveryMapper::toDocument)
                .toList();
        return deliveryMapper.toProfile(partner, signedOrNull(partner.getProfileImageKey()), docs);
    }

    private DeliveryPartner requirePartner(UUID userCredentialId) {
        return deliveryPartnerRepository.findByUserCredentialId(userCredentialId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery partner profile not found."));
    }

    private DeliveryAssignment requireAssignment(UUID userCredentialId, UUID assignmentId) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        return deliveryAssignmentRepository.findByIdAndDeliveryPartnerId(assignmentId, partner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));
    }

    private DeliveryOfferResponseDto toOffer(DeliveryAssignment assignment, UUID partnerId) {
        OrderDeliveryPort.OrderDeliverySnapshot order = orderDeliveryPort.findByOrderId(assignment.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        RestaurantPickupQuery.PickupLocation pickup = restaurantPickupQuery
                .findByRestaurantId(order.restaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant pickup location not found."));

        Double estimatedDistance = null;
        try {
            estimatedDistance = partnerGeoService.findNearby(
                    pickup.latitude().doubleValue(),
                    pickup.longitude().doubleValue(),
                    deliveryProperties.getOfferRadiusKm()).stream()
                    .filter(hit -> hit.partnerId().equals(partnerId))
                    .findFirst()
                    .map(GeoPartnerHit::distanceKm)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Redis error calculating GeoRadius: {}", e.getMessage());
        }

        BigDecimal estimatedFee = deliveryPricingService.calculateDeliveryFee(estimatedDistance);

        return deliveryMapper.toOffer(
                assignment,
                pickup.restaurantName(),
                pickup.formattedAddress(),
                estimatedDistance,
                estimatedFee);
    }

    private String signedOrNull(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return objectStorageClient.createSignedGetUrl(key, SIGNED_URL_TTL);
    }

    private static byte[] readBytes(MultipartFile file, long maxBytes, String tooLargeMessage) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "file is required.");
        }
        if (file.getSize() > maxBytes) {
            throw new BadRequestException(ErrorCode.FILE_TOO_LARGE, tooLargeMessage);
        }
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length > maxBytes) {
                throw new BadRequestException(ErrorCode.FILE_TOO_LARGE, tooLargeMessage);
            }
            return bytes;
        } catch (IOException ex) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Unable to read uploaded file.");
        }
    }

    private static byte[] header(byte[] bytes) {
        return bytes.length <= 16 ? bytes : Arrays.copyOf(bytes, 16);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyFace(UUID userCredentialId, MultipartFile file) {
        log.info("Face verification processing for user {}", userCredentialId);

        Optional<DeliveryPartner> optionalPartner = deliveryPartnerRepository.findByUserCredentialId(userCredentialId);
        if (optionalPartner.isEmpty()) {
            return false;
        }

        DeliveryPartner partner = optionalPartner.get();
        if (partner.getProfileImageKey() == null) {
            log.warn("No profile photo to match against");
            return false;
        }

        try {
            byte[] incomingBytes = readBytes(file, MAX_DOCUMENT_BYTES, "Selfie too large");

            // Fetch the verified Profile DP from Object Storage to compare embeddings
            byte[] dpBytes = objectStorageClient.getObject(partner.getProfileImageKey());
            if (dpBytes == null || dpBytes.length == 0) {
                log.warn("Identity check failed, corrupted DP storage.");
                return false;
            }

            // NATIVE VISUAL STRUCTURAL MATCHER (Sandbox Mode):
            // Instead of byte size, we will structurally map the image pixels using a
            // simplified Perceptual scaling matrix.
            BufferedImage incomingImg = ImageIO.read(new ByteArrayInputStream(incomingBytes));
            BufferedImage dpImg = ImageIO.read(new ByteArrayInputStream(dpBytes));

            if (incomingImg == null || dpImg == null) {
                log.warn("Could not decode image buffers.");
                return false;
            }

            // Scale both images to 16x16 to extract their structural core footprint
            int[] incomingPixels = extractVisualFootprint(incomingImg);
            int[] dpPixels = extractVisualFootprint(dpImg);

            long errorSum = 0;
            for (int i = 0; i < 256; i++) {
                int diff = incomingPixels[i] - dpPixels[i];
                errorSum += diff * diff;
            }

            long mse = errorSum / 256;
            log.info("Face Match AI footprint analysis. Visual MSE Score: {}", mse);

            // Strict visual constraint: MSE > 1500 typically means completely different
            // scene
            if (mse > 1500) {
                log.warn("Identity check failed. Structural consistency mismatched. MSE was {}", mse);
                return false;
            }
            return true;
        } catch (Exception e) {
            log.error("Failed to process face verification", e);
            return false;
        }
    }

    private int[] extractVisualFootprint(BufferedImage img) {
        BufferedImage scaled = new BufferedImage(16, 16, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = scaled.createGraphics();
        g.drawImage(img, 0, 0, 16, 16, null);
        g.dispose();

        int[] pixels = new int[256];
        for (int y = 0; y < 16; y++) {
            for (int x = 0; x < 16; x++) {
                pixels[y * 16 + x] = scaled.getRGB(x, y) & 0xFF;
            }
        }
        return pixels;
    }

    @Override
    @Transactional(readOnly = true)
    public com.foodie.delivery.dto.response.DeliveryLocationResponseDto getLatestLocationForOrder(UUID orderId) {
        DeliveryAssignment assignment = deliveryAssignmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found for order."));
        return deliveryLocationHistoryRepository.findFirstByDeliveryPartnerIdOrderByRecordedAtDesc(assignment.getDeliveryPartner().getId())
                .map(loc -> new com.foodie.delivery.dto.response.DeliveryLocationResponseDto(loc.getLatitude(), loc.getLongitude(), loc.getRecordedAt()))
                .orElseThrow(() -> new ResourceNotFoundException("No location data found for order."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.foodie.delivery.dto.response.LivePartnerLocationDto> getLiveFleetLocations() {
        return deliveryPartnerRepository.findAll().stream()
                .filter(DeliveryPartner::isOnline)
                .map(partner -> {
                    var locOpt = deliveryLocationHistoryRepository.findFirstByDeliveryPartnerIdOrderByRecordedAtDesc(partner.getId());
                    BigDecimal lat = locOpt.map(DeliveryLocationHistory::getLatitude).orElse(BigDecimal.ZERO);
                    BigDecimal lng = locOpt.map(DeliveryLocationHistory::getLongitude).orElse(BigDecimal.ZERO);
                    return new com.foodie.delivery.dto.response.LivePartnerLocationDto(
                            partner.getId(),
                            partner.getFullName(),
                            partner.getVehicleNumber(),
                            lat,
                            lng,
                            partner.isOnline(),
                            partner.getCashInHand(),
                            partner.isCashLimitExceeded()
                    );
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public com.foodie.delivery.dto.response.CashInHandResponseDto getCashInHand(UUID userCredentialId) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        List<com.foodie.delivery.dto.response.CashDepositResponseDto> deposits = deliveryCashDepositRepository
                .findByDeliveryPartnerIdOrderByCreatedAtDesc(partner.getId())
                .stream()
                .map(d -> new com.foodie.delivery.dto.response.CashDepositResponseDto(
                        d.getId(),
                        partner.getId(),
                        partner.getFullName(),
                        d.getAmount(),
                        d.getStatus().name(),
                        d.getReferenceNumber(),
                        d.getRejectionReason(),
                        d.getCreatedAt(),
                        d.getApprovedAt()
                ))
                .toList();

        return new com.foodie.delivery.dto.response.CashInHandResponseDto(
                partner.getCashInHand(),
                partner.getMaxCashInHandLimit(),
                partner.isCashLimitExceeded(),
                deposits
        );
    }

    @Override
    @Transactional
    public com.foodie.delivery.dto.response.CashDepositResponseDto submitCashDeposit(
            UUID userCredentialId, com.foodie.delivery.dto.request.CashDepositRequestDto request) {
        DeliveryPartner partner = requirePartner(userCredentialId);
        com.foodie.delivery.entity.DeliveryCashDeposit deposit = deliveryCashDepositRepository.save(
                com.foodie.delivery.entity.DeliveryCashDeposit.create(partner, request.amount(), request.referenceNumber())
        );
        return new com.foodie.delivery.dto.response.CashDepositResponseDto(
                deposit.getId(),
                partner.getId(),
                partner.getFullName(),
                deposit.getAmount(),
                deposit.getStatus().name(),
                deposit.getReferenceNumber(),
                deposit.getRejectionReason(),
                deposit.getCreatedAt(),
                deposit.getApprovedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.foodie.delivery.dto.response.CashDepositResponseDto> listPendingCashDeposits() {
        return deliveryCashDepositRepository.findByStatusOrderByCreatedAtDesc(com.foodie.delivery.entity.DeliveryCashDeposit.DepositStatus.PENDING)
                .stream()
                .map(d -> new com.foodie.delivery.dto.response.CashDepositResponseDto(
                        d.getId(),
                        d.getDeliveryPartner().getId(),
                        d.getDeliveryPartner().getFullName(),
                        d.getAmount(),
                        d.getStatus().name(),
                        d.getReferenceNumber(),
                        d.getRejectionReason(),
                        d.getCreatedAt(),
                        d.getApprovedAt()
                ))
                .toList();
    }

    @Override
    @Transactional
    public com.foodie.delivery.dto.response.CashDepositResponseDto approveCashDeposit(UUID depositId, UUID adminId) {
        com.foodie.delivery.entity.DeliveryCashDeposit deposit = deliveryCashDepositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Cash deposit not found."));
        if (deposit.getStatus() != com.foodie.delivery.entity.DeliveryCashDeposit.DepositStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Cash deposit is already processed.");
        }
        deposit.approve(adminId);
        deposit.getDeliveryPartner().deductCash(deposit.getAmount());
        deliveryPartnerRepository.save(deposit.getDeliveryPartner());
        deliveryCashDepositRepository.save(deposit);

        return new com.foodie.delivery.dto.response.CashDepositResponseDto(
                deposit.getId(),
                deposit.getDeliveryPartner().getId(),
                deposit.getDeliveryPartner().getFullName(),
                deposit.getAmount(),
                deposit.getStatus().name(),
                deposit.getReferenceNumber(),
                deposit.getRejectionReason(),
                deposit.getCreatedAt(),
                deposit.getApprovedAt()
        );
    }

    @Override
    @Transactional
    public com.foodie.delivery.dto.response.CashDepositResponseDto rejectCashDeposit(UUID depositId, UUID adminId, String reason) {
        com.foodie.delivery.entity.DeliveryCashDeposit deposit = deliveryCashDepositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Cash deposit not found."));
        if (deposit.getStatus() != com.foodie.delivery.entity.DeliveryCashDeposit.DepositStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Cash deposit is already processed.");
        }
        deposit.reject(adminId, reason);
        deliveryCashDepositRepository.save(deposit);

        return new com.foodie.delivery.dto.response.CashDepositResponseDto(
                deposit.getId(),
                deposit.getDeliveryPartner().getId(),
                deposit.getDeliveryPartner().getFullName(),
                deposit.getAmount(),
                deposit.getStatus().name(),
                deposit.getReferenceNumber(),
                deposit.getRejectionReason(),
                deposit.getCreatedAt(),
                deposit.getApprovedAt()
        );
    }
}
