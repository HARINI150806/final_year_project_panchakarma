package com.panchakarma.management.service.impl;

import com.panchakarma.management.model.Supplier;
import com.panchakarma.management.repository.SupplierRepository;
import com.panchakarma.management.service.SupplierService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Override
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + id));
    }

    @Override
    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @Override
    @Transactional
    public Supplier updateSupplier(Long id, Supplier details) {
        Supplier s = getSupplierById(id);
        s.setSupplierName(details.getSupplierName());
        s.setContactPerson(details.getContactPerson());
        s.setPhone(details.getPhone());
        s.setEmail(details.getEmail());
        s.setAddress(details.getAddress());
        if (details.getTotalOrders() != null) s.setTotalOrders(details.getTotalOrders());
        if (details.getPendingOrders() != null) s.setPendingOrders(details.getPendingOrders());
        return supplierRepository.save(s);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        supplierRepository.deleteById(id);
    }
}
