package com.foodie.delivery.controller;

import com.foodie.common.enums.OrderStatus;
import com.foodie.delivery.entity.DeliveryAssignment;
import com.foodie.delivery.repository.DeliveryAssignmentRepository;
import com.foodie.order.entity.Order;
import com.foodie.order.repository.OrderRepository;
import com.foodie.restaurant.entity.Restaurant;
import com.foodie.restaurant.entity.RestaurantAddress;
import com.foodie.restaurant.repository.RestaurantAddressRepository;
import com.foodie.restaurant.repository.RestaurantRepository;
import com.foodie.user.entity.Address;
import com.foodie.user.entity.Customer;
import com.foodie.auth.entity.UserCredential;
import com.foodie.user.repository.AddressRepository;
import com.foodie.user.repository.CustomerRepository;
import com.foodie.auth.repository.UserCredentialRepository;
import com.foodie.common.enums.UserType;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import com.foodie.delivery.service.DeliveryService;

@RestController
@RequestMapping("/api/v1/debug")
public class MockDataController {

        private final UserCredentialRepository ucRepo;
        private final CustomerRepository customerRepo;
        private final AddressRepository addressRepo;
        private final RestaurantAddressRepository resAddressRepo;
        private final RestaurantRepository restaurantRepo;
        private final OrderRepository orderRepo;
        private final DeliveryAssignmentRepository assignRepo;
        private final com.foodie.delivery.repository.DeliveryPartnerRepository partnerRepo;
        private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

        public MockDataController(
                        UserCredentialRepository ucRepo,
                        CustomerRepository customerRepo,
                        AddressRepository addressRepo,
                        RestaurantAddressRepository resAddressRepo,
                        RestaurantRepository restaurantRepo,
                        OrderRepository orderRepo,
                        DeliveryAssignmentRepository assignRepo,
                        com.foodie.delivery.repository.DeliveryPartnerRepository partnerRepo,
                        org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
                this.ucRepo = ucRepo;
                this.customerRepo = customerRepo;
                this.addressRepo = addressRepo;
                this.resAddressRepo = resAddressRepo;
                this.restaurantRepo = restaurantRepo;
                this.orderRepo = orderRepo;
                this.assignRepo = assignRepo;
                this.partnerRepo = partnerRepo;
                this.passwordEncoder = passwordEncoder;
        }

        @PostMapping("/seed-offer/{userCredentialId}")
        @Transactional
        public String seedOffer(@PathVariable UUID userCredentialId) {
                try {
                        String custPhone = "+1" + String.valueOf(System.currentTimeMillis()).substring(2, 12);
                        String resPhone = "+1" + String.valueOf(System.currentTimeMillis() + 1000).substring(2, 12);

                        // Customer
                        UserCredential custUc = UserCredential.phoneSignup(custPhone, UserType.CUSTOMER);
                        ucRepo.save(custUc);

                        Customer cust = Customer.createInitial(custUc.getId(), "cust@example.com");
                        customerRepo.save(cust);

                        Address custAddr = Address.create(cust, "Home", "123 Fake St", null, "Bengaluru", "560001",
                                        new BigDecimal("12.9716"), new BigDecimal("77.5946"), true);
                        addressRepo.save(custAddr);

                        // Restaurant
                        UserCredential resUc = UserCredential.phoneSignup(resPhone, UserType.RESTAURANT);
                        ucRepo.save(resUc);

                        RestaurantAddress resAddr = RestaurantAddress.create("456 Food St", null, "Bengaluru", "560001",
                                        new BigDecimal("12.9780"), new BigDecimal("77.6000"));
                        resAddressRepo.save(resAddr);

                        Restaurant res = Restaurant.createPending(resUc.getId(), "Test Restaurant", "Desc",
                                        new String[0],
                                        resAddr,
                                        new BigDecimal("10.0"));
                        res.approve();
                        restaurantRepo.save(res);

                        // Order
                        Order order = Order.place("ORD-" + System.currentTimeMillis(), cust.getId(), res.getId(),
                                        custAddr.getId(),
                                        new BigDecimal("100"), new BigDecimal("10"), new BigDecimal("0"),
                                        new BigDecimal("5"),
                                        new BigDecimal("115"), "idemp-" + System.currentTimeMillis());

                        // We set status directly to READY_FOR_PICKUP to allow mapping
                        order.transitionTo(OrderStatus.READY_FOR_PICKUP);
                        orderRepo.save(order);

                        // Fetch partner
                        com.foodie.delivery.entity.DeliveryPartner partner = partnerRepo
                                        .findByUserCredentialId(userCredentialId)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Partner not found by UC ID " + userCredentialId));

                        String otpHash = passwordEncoder.encode("123456");
                        DeliveryAssignment assignment = DeliveryAssignment.createOffered(order.getId(), partner,
                                        otpHash, otpHash);
                        assignRepo.save(assignment);

                        return "Successfully injected offer! Order ID: " + order.getId() + " | Assignment ID: "
                                        + assignment.getId();
                } catch (Exception e) {
                        return "Mock Error: " + e.getMessage() + "\n" + java.util.Arrays.toString(e.getStackTrace());
                }
        }

        @PostMapping("/setup-partner/{phone}")
        @Transactional
        public String setupPartner(@PathVariable String phone) {
                try {
                        String searchPhone = phone.startsWith("+") ? phone : "+91" + phone;
                        UserCredential uc = ucRepo.findByPhoneNumberAndUserType(searchPhone, UserType.DELIVERY_PARTNER)
                                        .orElseGet(() -> ucRepo
                                                        .findByPhoneNumberAndUserType(phone, UserType.DELIVERY_PARTNER)
                                                        .orElse(null));

                        if (uc == null) {
                                uc = UserCredential.phoneSignup(searchPhone, UserType.DELIVERY_PARTNER);
                                ucRepo.save(uc);
                        }

                        com.foodie.delivery.entity.DeliveryPartner partner = partnerRepo
                                        .findByUserCredentialId(uc.getId())
                                        .orElse(null);

                        if (partner == null) {
                                partner = com.foodie.delivery.entity.DeliveryPartner.create(uc.getId(), "Test Partner",
                                                com.foodie.common.enums.VehicleType.CYCLE, "BLA");
                                partnerRepo.save(partner);
                        }

                        partner.verifyKyc();
                        partnerRepo.save(partner);

                        return "KYC Verified! " + seedOffer(uc.getId());
                } catch (Exception e) {
                        return "Mock Error: " + e.getMessage();
                }
        }
}
