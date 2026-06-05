"""
Seed the database with sample data for development/demo.
Run: python seed_data.py
"""
from app import create_app, db
from app.models import User, DeliveryAgent, Shipment, TrackingHistory, Notification
from datetime import datetime, timedelta
import random

app = create_app('development')


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("🗑️  Cleared existing data")

        # ── Users ────────────────────────────────────────────────────────────
        admin = User(name='Admin User', email='admin@cargoflow.com', role='admin', phone='+1-555-0100')
        admin.set_password('admin123')

        customer1 = User(name='Alice Johnson', email='customer@cargoflow.com', role='customer', phone='+1-555-0101')
        customer1.set_password('customer123')

        customer2 = User(name='Bob Smith', email='bob@example.com', role='customer', phone='+1-555-0102')
        customer2.set_password('customer123')

        customer3 = User(name='Carol White', email='carol@example.com', role='customer', phone='+1-555-0103')
        customer3.set_password('customer123')

        agent_user1 = User(name='David Lee', email='agent@cargoflow.com', role='agent', phone='+1-555-0201')
        agent_user1.set_password('agent123')

        agent_user2 = User(name='Emma Davis', email='emma.agent@cargoflow.com', role='agent', phone='+1-555-0202')
        agent_user2.set_password('agent123')

        agent_user3 = User(name='Frank Miller', email='frank.agent@cargoflow.com', role='agent', phone='+1-555-0203')
        agent_user3.set_password('agent123')

        db.session.add_all([admin, customer1, customer2, customer3, agent_user1, agent_user2, agent_user3])
        db.session.flush()

        # ── Delivery Agents ──────────────────────────────────────────────────
        agent1 = DeliveryAgent(
            user_id=agent_user1.id, vehicle_type='van',
            vehicle_number='VAN-001', license_number='DL-12345',
            current_location='New York, NY', is_available=True,
            rating=4.8, total_deliveries=142,
        )
        agent2 = DeliveryAgent(
            user_id=agent_user2.id, vehicle_type='bike',
            vehicle_number='BIKE-007', license_number='DL-67890',
            current_location='Los Angeles, CA', is_available=True,
            rating=4.6, total_deliveries=98,
        )
        agent3 = DeliveryAgent(
            user_id=agent_user3.id, vehicle_type='truck',
            vehicle_number='TRK-042', license_number='DL-11223',
            current_location='Chicago, IL', is_available=False,
            rating=4.9, total_deliveries=215,
        )
        db.session.add_all([agent1, agent2, agent3])
        db.session.flush()

        # ── Shipments ────────────────────────────────────────────────────────
        statuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'delivered', 'delivered']
        priorities = ['standard', 'express', 'overnight']
        package_types = ['parcel', 'document', 'freight']

        customers = [customer1, customer2, customer3]
        agents = [agent1, agent2, agent3]

        cities = [
            ('123 Main St', 'New York', 'NY', '10001'),
            ('456 Oak Ave', 'Los Angeles', 'CA', '90001'),
            ('789 Pine Rd', 'Chicago', 'IL', '60601'),
            ('321 Elm St', 'Houston', 'TX', '77001'),
            ('654 Maple Dr', 'Phoenix', 'AZ', '85001'),
            ('987 Cedar Ln', 'Philadelphia', 'PA', '19101'),
            ('147 Birch Blvd', 'San Antonio', 'TX', '78201'),
            ('258 Walnut Way', 'San Diego', 'CA', '92101'),
        ]

        shipments = []
        for i in range(20):
            customer = random.choice(customers)
            agent = random.choice(agents)
            status = random.choice(statuses)
            priority = random.choice(priorities)
            pkg_type = random.choice(package_types)
            weight = round(random.uniform(0.5, 50.0), 2)
            declared_value = round(random.uniform(10, 500), 2)

            pickup = random.choice(cities)
            delivery = random.choice([c for c in cities if c != pickup])

            days_ago = random.randint(1, 30)
            created = datetime.utcnow() - timedelta(days=days_ago)

            days_map = {'standard': 5, 'express': 2, 'overnight': 1}
            est_delivery = created + timedelta(days=days_map[priority])

            shipping_cost = {'standard': 5.0, 'express': 12.0, 'overnight': 25.0}[priority] + weight * 1.5
            insurance_cost = declared_value * 0.01
            total_cost = shipping_cost + insurance_cost

            s = Shipment(
                sender_id=customer.id,
                agent_id=agent.id if status != 'pending' else None,
                recipient_name=f"Recipient {i+1}",
                recipient_email=f"recipient{i+1}@example.com",
                recipient_phone=f"+1-555-{1000+i:04d}",
                pickup_address=pickup[0],
                pickup_city=pickup[1],
                pickup_state=pickup[2],
                pickup_zip=pickup[3],
                pickup_country='USA',
                delivery_address=delivery[0],
                delivery_city=delivery[1],
                delivery_state=delivery[2],
                delivery_zip=delivery[3],
                delivery_country='USA',
                package_type=pkg_type,
                weight=weight,
                dimensions=f"{random.randint(10,60)}x{random.randint(10,60)}x{random.randint(5,40)} cm",
                description=f"Sample {pkg_type} shipment #{i+1}",
                declared_value=declared_value,
                shipping_cost=round(shipping_cost, 2),
                insurance_cost=round(insurance_cost, 2),
                total_cost=round(total_cost, 2),
                payment_status='paid' if status == 'delivered' else 'pending',
                status=status,
                priority=priority,
                estimated_delivery=est_delivery,
                actual_delivery=est_delivery if status == 'delivered' else None,
                created_at=created,
                updated_at=created,
            )
            db.session.add(s)
            db.session.flush()
            shipments.append(s)

            # Tracking history
            status_flow = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
            current_idx = status_flow.index(status) if status in status_flow else 0

            for j, st in enumerate(status_flow[:current_idx + 1]):
                ts = created + timedelta(hours=j * 8)
                descriptions = {
                    'pending': 'Shipment order created.',
                    'confirmed': 'Shipment confirmed and agent assigned.',
                    'picked_up': f'Package picked up from {pickup[1]}, {pickup[2]}.',
                    'in_transit': f'Package in transit via {random.choice(["air", "ground", "express"])} route.',
                    'out_for_delivery': f'Package out for delivery in {delivery[1]}.',
                    'delivered': f'Package delivered to {s.recipient_name}.',
                }
                h = TrackingHistory(
                    shipment_id=s.id,
                    status=st,
                    location=pickup[1] if j < 3 else delivery[1],
                    description=descriptions.get(st, f'Status: {st}'),
                    updated_by=admin.id,
                    timestamp=ts,
                )
                db.session.add(h)

        # ── Notifications ────────────────────────────────────────────────────
        for customer in customers:
            for i in range(3):
                n = Notification(
                    user_id=customer.id,
                    title=f'Shipment Update #{i+1}',
                    message=f'Your shipment has been updated. Check the tracking page for details.',
                    type=random.choice(['info', 'success', 'warning']),
                    is_read=random.choice([True, False]),
                    created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
                )
                db.session.add(n)

        db.session.commit()
        print("✅ Sample data seeded successfully!")
        print("\n📋 Login Credentials:")
        print("  Admin:   admin@cargoflow.com / admin123")
        print("  Customer: customer@cargoflow.com / customer123")
        print("  Agent:   agent@cargoflow.com / agent123")


if __name__ == '__main__':
    seed()
